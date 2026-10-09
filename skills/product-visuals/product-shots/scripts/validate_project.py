#!/usr/bin/env python3
"""Read-only validation of explicit project data; no network or credential discovery."""
import argparse
from datetime import date
from decimal import Decimal
import hashlib
import json
import math
from pathlib import Path
import re


def require(ok, message):
    if not ok:
        raise ValueError(message)


def number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def load(path):
    def pairs(items):
        data = {}
        for key, value in items:
            require(key not in data, 'duplicate JSON key')
            data[key] = value
        return data
    def constant(value):
        raise ValueError('non-finite JSON value')
    return json.loads(path.read_text(encoding='utf-8'), object_pairs_hook=pairs, parse_constant=constant)


def local_file(root, value):
    require(isinstance(value, str) and value and not Path(value).is_absolute(), 'file path must be project-relative')
    path = (root / value).resolve()
    require(path.is_relative_to(root.resolve()), 'file path escapes the project')
    require(path.is_file(), 'missing project file: ' + value)
    return path


def keys(obj, required, optional=()):
    require(isinstance(obj, dict), 'expected object')
    require(set(required) <= set(obj), 'missing fields: ' + ', '.join(sorted(set(required)-set(obj))))
    require(set(obj) <= set(required) | set(optional), 'unknown fields: ' + ', '.join(sorted(set(obj)-set(required)-set(optional))))


def nonempty(value):
    return isinstance(value, str) and bool(value.strip())


def unique(values, label):
    require(isinstance(values, list) and all(nonempty(v) for v in values), label + ' must be a string array')
    require(len(set(values)) == len(values), label + ' has duplicates')


def validate(config, root, ready=False):
    keys(config, ['schema_version','project_id','brand_profile','product','references','claims','market','copy_language','deliverables','module_order','views','platform_requirement','model','material','sizing','workflow'])
    require(config['schema_version'] == 1, 'unsupported config version')
    brand = load(local_file(root, config['brand_profile']))
    keys(brand, ['schema_version','brand_name','logo_reference','palette','font_references','voice','default_copy_language','default_market','visual_style','forbidden_elements'])
    require(brand['schema_version'] == 1, 'unsupported brand version')
    for k in ['brand_name','voice','default_copy_language','default_market','visual_style']:
        require(brand[k] is None or nonempty(brand[k]), 'invalid brand.'+k)
    for k in ['palette','font_references','forbidden_elements']:
        unique(brand[k], 'brand.'+k)
    for p in ([brand['logo_reference']] if brand['logo_reference'] else []) + brand['font_references']:
        local_file(root, p)
    require(config['project_id'] is None or nonempty(config['project_id']), 'invalid project_id')
    for k in ['market','copy_language']:
        require(config[k] is None or nonempty(config[k]), 'invalid '+k)
    refs = {}
    require(isinstance(config['references'], list), 'references must be an array')
    for ref in config['references']:
        keys(ref, ['id','path','roles'])
        require(nonempty(ref['id']) and ref['id'] not in refs, 'duplicate/invalid reference id')
        unique(ref['roles'], 'reference.roles')
        require(ref['roles'] and set(ref['roles']) <= {'product','detail','color','model','style','evidence'}, 'invalid reference roles')
        local_file(root, ref['path'])
        refs[ref['id']] = ref

    def binding(ids, roles=None, required=False):
        unique(ids, 'reference binding')
        require(not required or bool(ids), 'missing required reference binding')
        for rid in ids:
            require(rid in refs, 'unknown reference id: '+rid)
            if roles:
                require(bool(set(refs[rid]['roles']) & set(roles)), 'reference role mismatch: '+rid)

    product = config['product']
    keys(product, ['category','audience','reference_ids','locked_features','colors'])
    for k in ['category','audience']:
        require(product[k] is None or nonempty(product[k]), 'invalid product.'+k)
    unique(product['locked_features'], 'locked_features')
    binding(product['reference_ids'], ['product'], ready)
    require(isinstance(product['colors'], list), 'colors must be an array')
    colors = []
    for color in product['colors']:
        keys(color, ['id','name','reference_ids'])
        require(nonempty(color['name']), 'missing color name')
        colors.append(color['id'])
        binding(color['reference_ids'], ['color'], True)
    unique(colors, 'color ids')
    if ready:
        require(nonempty(config['project_id']) and nonempty(product['category']) and nonempty(product['audience']), 'ready config needs project id, category and audience')
        for field in ['market','copy_language']:
            require(nonempty(config[field] or brand['default_'+field]), 'missing '+field)
    claims = {}
    require(isinstance(config['claims'], list), 'claims must be an array')
    for claim in config['claims']:
        keys(claim, ['id','text','scope','status','source_ids'])
        require(nonempty(claim['id']) and claim['id'] not in claims, 'duplicate/invalid claim id')
        require(nonempty(claim['text']), 'claim text is empty')
        require(claim['scope'] in {'brand','fiber','fabric','garment','product','tag'}, 'invalid claim scope')
        require(claim['status'] in {'verified','pending','rejected'}, 'invalid claim status')
        binding(claim['source_ids'], ['evidence'], claim['status'] == 'verified')
        claims[claim['id']] = claim
    unique(config['deliverables'], 'deliverables')
    require(bool(config['deliverables']) and set(config['deliverables']) <= {'main','detail_page','modules','material_page','sizing','multi_angle','ad','social','editable_source','preview','archive'}, 'invalid deliverables')
    unique(config['module_order'], 'module_order')
    require(set(config['module_order']) <= {'hero','details','views','lifestyle','colors','material','sizing','care'}, 'invalid module_order')
    unique(config['views'], 'views')
    platform = config['platform_requirement']
    keys(platform, ['placement','width_px','height_px','source','checked_on','status'])
    require(platform['status'] in {'verified','unverified'}, 'invalid platform status')
    for k in ['placement','source','checked_on']:
        require(platform[k] is None or nonempty(platform[k]), 'invalid platform.'+k)
    w,h = platform['width_px'], platform['height_px']
    require((w is None and h is None) or (type(w) is int and type(h) is int and w > 0 and h > 0), 'dimensions must be a positive integer pair')
    if platform['status'] == 'verified':
        require(all(nonempty(platform[k]) for k in ['source','checked_on','placement']), 'verified platform needs source/date/placement')
        require(date.fromisoformat(platform['checked_on']) <= date.today(), 'future platform verification date')
    model = config['model']
    keys(model, ['identity_reference_id','age_group','height_target_cm','action'])
    if model['identity_reference_id'] is not None:
        binding([model['identity_reference_id']], ['model'])
    require(model['age_group'] in {None,'adult','child'}, 'invalid model age group')
    require(model['action'] is None or nonempty(model['action']), 'invalid model action')
    height = model['height_target_cm']
    require(height is None or (number(height) and height > 0), 'invalid model height target')
    material = config['material']
    keys(material, ['enabled','partner_name','composition','claim_ids','included_tag_reference_ids','standalone'])
    require(type(material['enabled']) is bool and type(material['standalone']) is bool, 'invalid material flags')
    require(not material['standalone'] or material['enabled'], 'standalone material page requires enabled material')
    require(material['partner_name'] is None or nonempty(material['partner_name']), 'invalid partner name')
    unique(material['claim_ids'], 'material.claim_ids')
    for cid in material['claim_ids']:
        require(cid in claims and claims[cid]['status'] == 'verified', 'material includes unverified claim: '+cid)
    binding(material['included_tag_reference_ids'], ['detail','evidence'])
    require(isinstance(material['composition'], list), 'composition must be an array')
    total = Decimal('0')
    for item in material['composition']:
        keys(item, ['fiber','percent','source_ids'])
        require(nonempty(item['fiber']) and number(item['percent']) and 0 < item['percent'] <= 100, 'invalid composition')
        binding(item['source_ids'], ['evidence'], True)
        total += Decimal(str(item['percent']))
    require(not material['composition'] or total == 100, 'composition must sum to 100')
    size = config['sizing']
    keys(size, ['mode','labels','measurement','unit','source_ids','confirmed','rows'])
    require(size['mode'] in {'measurement_guide','body_ranges','garment_measurements'}, 'invalid sizing mode')
    require(type(size['confirmed']) is bool, 'invalid sizing confirmation')
    unique(size['labels'], 'sizing labels')
    binding(size['source_ids'], ['evidence'])
    require(size['unit'] in {None,'in','cm'}, 'invalid sizing unit')
    require(size['measurement'] is None or nonempty(size['measurement']), 'invalid sizing measurement')
    require(isinstance(size['rows'], list), 'sizing rows must be an array')
    if size['mode'] == 'measurement_guide':
        require(not size['rows'], 'measurement guide cannot contain invented size mapping')
    else:
        require(size['unit'] and nonempty(size['measurement']), 'numeric sizing needs unit and measurement method')
        if ready or size['confirmed']:
            require(size['confirmed'] and size['source_ids'] and size['rows'], 'numeric sizing needs approved product evidence')
        labels = []
        for row in size['rows']:
            keys(row, ['label','min','max'] if size['mode']=='body_ranges' else ['label','value'])
            labels.append(row['label'])
            vals = [row['min'],row['max']] if size['mode']=='body_ranges' else [row['value']]
            require(all(number(v) and v > 0 for v in vals), 'sizing values must be positive')
            require(len(vals)==1 or vals[0] < vals[1], 'invalid size interval')
        require(labels == size['labels'], 'size rows must match label order exactly')
    workflow = config['workflow']
    keys(workflow, ['mode','generation','revision_scope','publish'])
    require(workflow['mode'] in {'direct','plan_first'}, 'invalid workflow mode')
    require(workflow['generation'] == 'host_builtin', 'external generation is not configured or authorized here')
    require(workflow['revision_scope'] in {'affected','full'}, 'invalid revision scope')
    require(workflow['publish'] is False, 'configuration cannot authorize publishing')
    return refs


def validate_manifest(manifest, root, refs):
    keys(manifest, ['schema_version','project_id','revision','assets'])
    require(manifest['schema_version']==1 and nonempty(manifest['project_id']) and nonempty(manifest['revision']), 'invalid manifest header')
    require(isinstance(manifest['assets'],list) and manifest['assets'], 'manifest assets must not be empty')
    ids = [a.get('id') for a in manifest['assets']]
    unique(ids, 'asset ids')
    dependencies = {}
    for asset in manifest['assets']:
        keys(asset, ['id','role','path','status','sha256','width_px','height_px','depends_on','source_ids','checks'], ['color','view','approval_reference'])
        require(asset['role'] in {'main','detail_page','module','material','sizing','multi_angle','ad','social','editable_source','preview','archive'}, 'invalid asset role')
        require(asset['status'] in {'candidate','checked','user_approved','rejected'}, 'invalid asset status')
        path = local_file(root, asset['path'])
        require(isinstance(asset['sha256'],str) and re.fullmatch('[a-f0-9]{64}',asset['sha256']), 'invalid sha256')
        require(hashlib.sha256(path.read_bytes()).hexdigest()==asset['sha256'], 'asset changed since manifest: '+asset['id'])
        w,h = asset['width_px'], asset['height_px']
        require((w is None and h is None) or (type(w) is int and type(h) is int and w>0 and h>0), 'invalid asset dimensions')
        unique(asset['depends_on'],'asset dependencies')
        require(set(asset['depends_on']) <= set(ids) and asset['id'] not in asset['depends_on'], 'unknown/self dependency')
        dependencies[asset['id']] = asset['depends_on']
        unique(asset['source_ids'],'asset sources')
        require(set(asset['source_ids']) <= set(refs), 'unknown asset source')
        require(isinstance(asset['checks'],list), 'checks must be an array')
        for c in asset['checks']:
            keys(c,['name','result','note'])
            require(nonempty(c['name']) and nonempty(c['note']) and c['result'] in {'pass','fail','pending'}, 'invalid check record')
        if asset['status'] in {'checked','user_approved'}:
            require(asset['checks'] and all(c['result']=='pass' for c in asset['checks']), 'accepted asset needs passing checks')
        if asset['status']=='user_approved':
            require(nonempty(asset.get('approval_reference')), 'user approval needs actual reference')
    done, visiting = set(),set()
    def visit(node):
        require(node not in visiting, 'dependency cycle')
        if node in done:return
        visiting.add(node)
        for child in dependencies[node]:visit(child)
        visiting.remove(node);done.add(node)
    for node in ids:visit(node)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('config',type=Path)
    parser.add_argument('--project-root',type=Path,required=True)
    parser.add_argument('--ready',action='store_true')
    parser.add_argument('--manifest',type=Path)
    args = parser.parse_args()
    try:
        config=load(args.config)
        refs=validate(config,args.project_root,args.ready)
        if args.manifest:
            manifest=load(args.manifest)
            require(manifest['project_id']==config['project_id'], 'manifest project mismatch')
            validate_manifest(manifest,args.project_root,refs)
    except (ValueError, OSError, KeyError, TypeError, AttributeError) as error:
        print('FAIL:', error);return 1
    print('PASS: data, references and optional manifest checks; visual/factual approval still requires inspection')
    return 0

if __name__=='__main__':
    raise SystemExit(main())
