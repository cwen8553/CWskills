#!/usr/bin/env python3
"""Offline release checks. Needs PyYAML; Node.js/bash syntax checks require those tools."""
import ast
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys
from urllib.parse import unquote

try:
    import yaml
except ImportError:
    raise SystemExit('PyYAML is required; see requirements-checks.txt')

ROOT=Path(__file__).resolve().parents[1]
errors=[]
counts={'skills':0,'json':0,'yaml':0,'markdown_links':0,'python':0,'javascript':0,'shell':0}

def fail(path,message):errors.append(f'{path.relative_to(ROOT)}: {message}')

def read(path):return path.read_text(encoding='utf-8')

def anchors(path):
    text=re.sub(r'```.*?```','',read(path),flags=re.S)
    result=set(re.findall(r'id=[\"\']([^\"\']+)[\"\']',text))
    seen={}
    for heading in re.findall(r'^#{1,6}\s+(.+?)\s*#*\s*$',text,re.M):
        heading=re.sub(r'<[^>]+>','',heading)
        heading=re.sub(r'\[([^\]]+)\]\([^)]+\)',r'\1',heading)
        slug=re.sub(r'[^\w -]','',heading.lower()).replace(' ','-')
        count=seen.get(slug,0);seen[slug]=count+1
        result.add(slug if count==0 else slug+'-'+str(count))
    return result

def yaml_load(text):
    class UniqueLoader(yaml.SafeLoader):pass
    def mapping(loader,node,deep=False):
        result={}
        for key,value in node.value:
            key=loader.construct_object(key,deep=deep)
            if key in result:raise ValueError('duplicate YAML key')
            result[key]=loader.construct_object(value,deep=deep)
        return result
    UniqueLoader.add_constructor(yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG,mapping)
    return yaml.load(text,Loader=UniqueLoader)


def json_load(text):
    def pairs(items):
        obj={}
        for key,value in items:
            if key in obj:raise ValueError('duplicate JSON key')
            obj[key]=value
        return obj
    return json.loads(text,object_pairs_hook=pairs,parse_constant=lambda x: (_ for _ in ()).throw(ValueError('non-finite JSON value')))


def main():
    ignored={'.git','.venv','node_modules','__pycache__','.pytest_cache'}
    files=[p for p in ROOT.rglob('*') if p.is_file() and not (set(p.relative_to(ROOT).parts)&ignored)]
    skills={}
    node=shutil.which('node');bash=shutil.which('bash')
    if not node:errors.append('Node.js is required for JavaScript syntax checks')
    if not bash:errors.append('bash is required for Shell syntax checks')
    private_patterns=[
        r'/(?:Users|home)/[A-Za-z0-9_.-]+/',
        r'[A-Za-z]:\\Users\\[^\\\s]+',
        r'\b(?:ghp_|gho_|github_pat_)[A-Za-z0-9_]{20,}',
        r'\bsk-[A-Za-z0-9_-]{24,}',
        r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
        r'\bAKIA[0-9A-Z]{16}\b',
        r'(?i)\b(?:api_key|password|access_token|cookie)\s*[:=]\s*[\"\'][^\"\'\s]{8,}[\"\']',
    ]
    for p in files:
        if p.suffix not in {'.md','.json','.yaml','.yml','.py','.js','.mjs','.cjs','.sh','.txt'}:continue
        try:text=read(p)
        except UnicodeError:fail(p,'not UTF-8');continue
        for pattern in private_patterns:
            if re.search(pattern,text):fail(p,'possible private path or secret; review without printing value')
        try:
            if p.suffix=='.json':json_load(text);counts['json']+=1
            if p.suffix in {'.yaml','.yml'}:yaml_load(text);counts['yaml']+=1
            if p.name=='SKILL.md':
                match=re.match(r'\A---\s*\n(.*?)\n---(?:\n|$)',text,re.S)
                if not match:raise ValueError('missing YAML frontmatter')
                data=yaml_load(match.group(1));counts['yaml']+=1
                if data.get('name')!=p.parent.name:raise ValueError('name differs from directory')
                if not re.fullmatch('[a-z0-9]+(?:-[a-z0-9]+)*',data['name']):raise ValueError('invalid skill name')
                if not isinstance(data.get('description'),str) or not data['description'].strip():raise ValueError('missing description')
                if data['name'] in skills:raise ValueError('duplicate skill name')
                if len(text.splitlines())>500:raise ValueError('entrypoint exceeds 500 lines')
                if not (p.parent/'README.md').is_file():raise ValueError('missing README')
                skills[data['name']]=p.parent;counts['skills']+=1
            if p.suffix=='.md':
                if text.startswith('---\n') and p.name!='SKILL.md':
                    front=text.split('---',2)
                    if len(front)==3:yaml_load(front[1]);counts['yaml']+=1
                # Ignore fenced examples; verify Markdown destinations and HTML href/src.
                plain=re.sub(r'```.*?```','',text,flags=re.S)
                links=re.findall(r'!?\[[^\]\n]*\]\(([^)\n]+)\)',plain)
                links+=re.findall(r'(?:href|src)=[\"\']([^\"\']+)[\"\']',plain)
                links+=re.findall(r'^\s*\[[^\]]+\]:\s*(\S+)',plain,re.M)
                for link in links:
                    link=link.strip().split(' "')[0].strip('<>')
                    if re.match(r'^[a-zA-Z][a-zA-Z0-9+.-]*:',link):continue
                    destination=unquote(link.split('#')[0].split('?')[0])
                    target=(p.parent/destination).resolve() if destination else p
                    counts['markdown_links']+=1
                    if not target.is_relative_to(ROOT) or not target.exists():fail(p,'broken/outside local link: '+destination)
                    elif '#' in link and target.suffix=='.md':
                        fragment=unquote(link.split('#',1)[1])
                        if fragment and fragment not in anchors(target):fail(p,'missing local anchor: '+link)
            if p.suffix=='.py':ast.parse(text,filename=str(p));counts['python']+=1
            tool = node if p.suffix in {'.js','.mjs','.cjs'} else bash if p.suffix=='.sh' else None
            if tool:
                flag='--check' if tool==node else '-n'
                result=subprocess.run([tool,flag,str(p)],capture_output=True,text=True)
                if result.returncode:fail(p,'script syntax check failed: '+result.stderr[:300])
                counts['javascript' if tool==node else 'shell']+=1
        except (ValueError,TypeError,KeyError,SyntaxError,yaml.YAMLError) as error:fail(p,str(error))
    catalog=json_load(read(ROOT/'catalog.json'));listed={}
    for category in catalog['categories']:
        category_readme=ROOT/'skills'/category['id']/'README.md'
        if not category_readme.is_file():errors.append('missing category README: '+category['id']);continue
        for item in category['skills']:
            name=item['name']
            if name in listed:errors.append('duplicate catalog entry: '+name)
            listed[name]=item
            if name not in skills or skills.get(name)!=ROOT/item['path']:errors.append('catalog path mismatch: '+name)
            if name not in read(category_readme) or name not in read(ROOT/'README.md'):errors.append('missing navigation: '+name)
            for config in item.get('configuration',[]):
                if not (ROOT/config).is_file():errors.append('missing configuration: '+config)
    if set(listed)!=set(skills):errors.append('catalog and skill inventory differ')
    for item in listed.values():
        for dep in item.get('dependencies',[]):
            if dep not in listed:errors.append('unknown dependency: '+dep)
    if errors:
        print('\n'.join('FAIL: '+e for e in errors));return 1
    print('PASS:',json.dumps(counts,ensure_ascii=False))
    print('Static checks only: inspect license provenance, external calls, factual evidence and actual images separately.')
    return 0

if __name__=='__main__':raise SystemExit(main())
