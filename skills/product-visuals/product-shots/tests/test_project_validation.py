"""Synthetic inputs only: these measurements are not consumer sizing guidance."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

BASE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('project_validator', BASE/'scripts/validate_project.py')
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


class ProjectValidation(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        (self.root/'config').mkdir()
        (self.root/'config/brand-profile.json').write_text((BASE/'assets/brand-profile-template.json').read_text())
        (self.root/'source.txt').write_text('Synthetic evidence, not actual product data.')
        self.config = json.loads((BASE/'assets/project-config-template.json').read_text())

    def ready(self):
        c=self.config
        c.update(project_id='synthetic-fixture',market='US',copy_language='en-US')
        c['references']=[{'id':'ref','path':'source.txt','roles':['product','evidence','color']}]
        c['product'].update(category='test top',audience='adult',reference_ids=['ref'])
        return c

    def test_template_is_draft_not_ready(self):
        mod.validate(self.config,self.root)
        with self.assertRaises(ValueError):mod.validate(self.config,self.root,True)

    def test_ready_with_brand_defaults(self):
        c=self.ready();c['market']=None
        p=self.root/'config/brand-profile.json';b=json.loads(p.read_text());b['default_market']='US';p.write_text(json.dumps(b))
        mod.validate(c,self.root,True)

    def test_color_requires_actual_color_reference(self):
        c=self.ready();c['product']['colors']=[{'id':'a','name':'synthetic','reference_ids':['ref']}]
        mod.validate(c,self.root,True)
        c['references'][0]['roles']=['product']
        with self.assertRaises(ValueError):mod.validate(c,self.root,True)

    def test_unknown_and_duplicate_references(self):
        c=self.ready();c['product']['reference_ids']=['absent']
        with self.assertRaises(ValueError):mod.validate(c,self.root)
        c=self.ready();c['references'].append(copy.deepcopy(c['references'][0]))
        with self.assertRaises(ValueError):mod.validate(c,self.root)

    def test_path_escape_and_symlink(self):
        c=self.ready();c['references'][0]['path']='../outside.txt'
        with self.assertRaises(ValueError):mod.validate(c,self.root)
        with tempfile.TemporaryDirectory() as other:
            p=Path(other)/'data';p.write_text('synthetic')
            (self.root/'link').symlink_to(p)
            c['references'][0]['path']='link'
            with self.assertRaises(ValueError):mod.validate(c,self.root)

    def test_verified_claim_requires_evidence(self):
        c=self.ready();c['claims']=[{'id':'c','text':'synthetic claim','scope':'fabric','status':'verified','source_ids':[]}]
        with self.assertRaises(ValueError):mod.validate(c,self.root)
        c['claims'][0]['source_ids']=['ref'];mod.validate(c,self.root)

    def test_material_cannot_publish_pending_claim(self):
        c=self.ready();c['claims']=[{'id':'c','text':'synthetic claim','scope':'fiber','status':'pending','source_ids':['ref']}]
        c['material']['claim_ids']=['c']
        with self.assertRaises(ValueError):mod.validate(c,self.root)

    def test_composition_total(self):
        c=self.ready();c['material']['composition']=[{'fiber':'synthetic A','percent':35,'source_ids':['ref']},{'fiber':'synthetic B','percent':65,'source_ids':['ref']}]
        mod.validate(c,self.root)
        c['material']['composition'][1]['percent']=60
        with self.assertRaises(ValueError):mod.validate(c,self.root)

    def test_body_ranges_need_confirmed_product_data(self):
        c=self.ready();s=c['sizing'];s.update(mode='body_ranges',labels=['test-size'],measurement='synthetic circumference',unit='cm',source_ids=['ref'],rows=[{'label':'test-size','min':10,'max':20}])
        with self.assertRaises(ValueError):mod.validate(c,self.root,True)
        s['confirmed']=True;mod.validate(c,self.root,True)
        s['rows'][0]['max']=9
        with self.assertRaises(ValueError):mod.validate(c,self.root,True)

    def test_garment_values_not_range_rows(self):
        c=self.ready();c['sizing'].update(mode='garment_measurements',labels=['test-size'],measurement='synthetic flat width',unit='cm',source_ids=['ref'],confirmed=True,rows=[{'label':'test-size','value':12}])
        mod.validate(c,self.root,True)
        c['sizing']['rows'][0]={'label':'test-size','min':10,'max':20}
        with self.assertRaises(ValueError):mod.validate(c,self.root,True)

    def test_platform_must_have_source_and_date(self):
        c=self.ready();c['platform_requirement']['status']='verified'
        with self.assertRaises(ValueError):mod.validate(c,self.root)

    def test_configuration_is_not_upload_permission(self):
        c=self.ready();c['workflow']['publish']=True
        with self.assertRaises(ValueError):mod.validate(c,self.root)
        c['workflow']['publish']=False;c['workflow']['generation']='external'
        with self.assertRaises(ValueError):mod.validate(c,self.root)

    def manifest(self):
        c=self.ready();refs=mod.validate(c,self.root)
        asset={'id':'a','role':'editable_source','path':'source.txt','status':'checked','sha256':hashlib.sha256((self.root/'source.txt').read_bytes()).hexdigest(),'width_px':None,'height_px':None,'depends_on':[],'source_ids':['ref'],'checks':[{'name':'synthetic test check','result':'pass','note':'Fixture only'}]}
        return {'schema_version':1,'project_id':c['project_id'],'revision':'test','assets':[asset]},refs

    def test_manifest_detects_changed_file(self):
        m,refs=self.manifest();mod.validate_manifest(m,self.root,refs)
        (self.root/'source.txt').write_text('changed')
        with self.assertRaises(ValueError):mod.validate_manifest(m,self.root,refs)

    def test_manifest_rejects_false_approval_and_failed_checks(self):
        m,refs=self.manifest();m['assets'][0]['status']='user_approved'
        with self.assertRaises(ValueError):mod.validate_manifest(m,self.root,refs)
        m['assets'][0]['approval_reference']='synthetic confirmation';mod.validate_manifest(m,self.root,refs)
        m['assets'][0]['checks'][0]['result']='fail'
        with self.assertRaises(ValueError):mod.validate_manifest(m,self.root,refs)

    def test_dependency_cycle(self):
        m,refs=self.manifest();b=copy.deepcopy(m['assets'][0]);b['id']='b';b['depends_on']=['a'];m['assets'][0]['depends_on']=['b'];m['assets'].append(b)
        with self.assertRaises(ValueError):mod.validate_manifest(m,self.root,refs)

if __name__=='__main__':unittest.main()
