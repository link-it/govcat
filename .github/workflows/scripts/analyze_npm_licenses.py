#!/usr/bin/env python3
"""
Script per l'analisi delle licenze delle dipendenze NPM
Genera report in formato CSV, HTML, JSON e Markdown

Uso: python3 analyze_npm_licenses.py [--exceptions file.json]
"""

import json
import os
import subprocess
import sys
import csv
import argparse
from collections import defaultdict
import html as html_module

def load_exceptions(exception_file='license-exceptions.json'):
    """Carica le eccezioni dal file JSON"""
    try:
        with open(exception_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            exceptions = {}
            for exc in data.get('exceptions', []):
                key = f"{exc['groupId']}:{exc['artifactId']}" if exc['artifactId'] != '*' else f"{exc['groupId']}:*"
                exceptions[key] = {
                    'reason': exc['reason'],
                    'exclude_from_reports': exc.get('exclude_from_reports', False)
                }
            return exceptions
    except FileNotFoundError:
        print(f"File eccezioni {exception_file} non trovato!")
        return {}
    except json.JSONDecodeError as e:
        print(f"Errore nel parsing del file eccezioni: {e}")
        return {}

def matches_exception(name, exceptions):
    """Verifica se un package corrisponde a un'eccezione"""
    # Prima prova con il nome diretto (per compatibilità con formato Maven)
    direct_key = f"{name}:{name}"
    if direct_key in exceptions:
        return exceptions[direct_key]

    # Poi prova solo con il nome
    if name in exceptions:
        return exceptions[name]

    # Gestisce scope packages: @scope/name -> @scope:*
    if name.startswith('@') and '/' in name:
        scope = name.split('/')[0]
        wildcard_key = f"{scope}:*"
        if wildcard_key in exceptions:
            return exceptions[wildcard_key]

    return None

def get_npm_dependencies():
    """Estrae le dipendenze npm e le loro licenze"""
    try:
        # Esegue npm list con formato JSON per ottenere tutte le dipendenze
        result = subprocess.run(
            ['npm', 'list', '--json', '--prod', '--long'],
            capture_output=True,
            text=True,
            check=False  # Non fallisce se ci sono warning
        )

        if result.returncode != 0 and result.returncode != 1:
            # npm list può restituire 1 se ci sono warning, ma JSON è comunque valido
            print(f"Warning: npm list returned code {result.returncode}")
            print(f"stderr: {result.stderr}")

        npm_data = json.loads(result.stdout)
        return npm_data

    except subprocess.CalledProcessError as e:
        print(f"Errore nell'esecuzione di npm list: {e}")
        print(f"stderr: {e.stderr}")
        return None
    except json.JSONDecodeError as e:
        print(f"Errore nel parsing del JSON di npm list: {e}")
        return None

def flatten_dependencies(npm_data, prefix=""):
    """Appiattisce l'albero delle dipendenze npm"""
    dependencies = []
    root_package_name = npm_data.get('name', '')

    def extract_deps(node, path="", is_root=False):
        name = node.get('name', '')
        version = node.get('version', '')
        license_info = node.get('license', 'Unknown')

        # Gestisce licenze in formato oggetto
        if isinstance(license_info, dict):
            license_info = license_info.get('type', 'Unknown')
        elif isinstance(license_info, list):
            # Gestisce array di licenze (dual license)
            if len(license_info) > 0:
                if isinstance(license_info[0], dict):
                    license_info = ' OR '.join([lic.get('type', 'Unknown') for lic in license_info])
                else:
                    license_info = ' OR '.join(license_info)
            else:
                license_info = 'Unknown'

        # Escludi il package root (il progetto stesso) dall'analisi
        if name and not is_root:
            # Se la licenza è Unknown, prova a cercarla su GitHub
            if str(license_info).upper() in ['UNKNOWN', 'NONE', '']:
                github_license = search_github_license(name)
                if github_license:
                    license_info = github_license
            dep_path = f"{path}/{name}" if path else name
            dependencies.append({
                'name': name,
                'version': version,
                'license': str(license_info),
                'path': dep_path
            })

        # Ricorsione sulle dipendenze
        deps = node.get('dependencies', {})
        for dep_name, dep_node in deps.items():
            new_path = f"{path}/{name}" if name else path
            extract_deps(dep_node, new_path, is_root=False)

    extract_deps(npm_data, is_root=True)
    return dependencies

def search_github_license(package_name):
    """Cerca la licenza su GitHub per package con licenza sconosciuta"""
    # Verifica che il nome del package non sia vuoto
    if not package_name or not package_name.strip():
        return None

    try:
        # Usa urllib invece di curl per compatibilità con Alpine
        import urllib.request
        import urllib.parse

        # Cerca repository su GitHub (senza filtri di linguaggio per maggiore flessibilità)
        encoded_query = urllib.parse.quote(package_name)
        url = f'https://api.github.com/search/repositories?q={encoded_query}&sort=stars&order=desc&per_page=1'

        req = urllib.request.Request(url)
        req.add_header('User-Agent', 'Python-License-Analyzer')

        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode('utf-8'))
            if data.get('total_count', 0) > 0:
                repo = data['items'][0]
                license_info = repo.get('license')
                if license_info and license_info.get('key'):
                    license_name = license_info.get('name', license_info.get('key'))
                    print(f"    🔍 GitHub search per {package_name}: trovata licenza {license_name}")
                    return license_name

    except Exception as e:
        print(f"    ⚠️ Errore nella ricerca GitHub per {package_name}: {e}")

    return None

def normalize_license_with_version(license):
    """Normalizza il nome della licenza aggiungendo la versione dove nota"""
    license_upper = license.upper()

    # Mapping delle licenze con versioni note
    license_mappings = {
        'MIT': 'MIT',
        'ISC': 'ISC',
        'APACHE': 'Apache-2.0',
        'APACHE-2.0': 'Apache-2.0',
        'APACHE 2': 'Apache-2.0',
        'APACHE 2.0': 'Apache-2.0',
        'APACHE LICENSE 2.0': 'Apache-2.0',
        'APACHE LICENSE, VERSION 2.0': 'Apache-2.0',
        'THE APACHE SOFTWARE LICENSE, VERSION 2.0': 'Apache-2.0',
        'BSD': 'BSD-3-Clause',
        'BSD-2-CLAUSE': 'BSD-2-Clause',
        'BSD-3-CLAUSE': 'BSD-3-Clause',
        '0BSD': '0BSD',
        'CC0-1.0': 'CC0-1.0',
        'CC BY SA': 'CC-BY-SA-4.0',  # Default a 4.0 se non specificato
        'CC-BY-4.0': 'CC-BY-4.0',
        'CC-BY-SA-4.0': 'CC-BY-SA-4.0',
        'LGPL-2.1': 'LGPL-2.1',
        'LGPL 2.1': 'LGPL-2.1',
        'LGPL-3.0': 'LGPL-3.0',
        'LGPL 3.0': 'LGPL-3.0',
        'UNLICENSE': 'Unlicense',
        'WTFPL': 'WTFPL',
        'MIT LICENSE': 'MIT'  # GitHub API restituisce spesso "MIT License"
    }

    return license_mappings.get(license_upper, license)

def analyze_license_compatibility(license):
    """Analizza la compatibilità di una licenza con GPLv3 e enterprise"""
    # Prima normalizza la licenza con la versione
    normalized_license = normalize_license_with_version(license)
    license_upper = normalized_license.upper()

    # Licenze compatibili con GPLv3 e enterprise
    gplv3_compatible_licenses = {
        'MIT', 'BSD', 'BSD-2-CLAUSE', 'BSD-3-CLAUSE', 'APACHE-2.0', 'ISC',
        'CC0-1.0', 'UNLICENSE', 'WTFPL', 'APACHE', 'APACHE LICENSE 2.0',
        'THE APACHE SOFTWARE LICENSE, VERSION 2.0', '0BSD', 'BSD-0-CLAUSE',
        'CC-BY-4.0'  # CC BY (senza SA) è sia GPLv3 che enterprise compatible
    }

    # Licenze enterprise-safe ma non GPLv3 compatibili
    enterprise_safe_licenses = {
        'GPL-2.0', 'GPL-3.0', 'LGPL-2.1', 'LGPL-3.0', 'EPL-1.0', 'EPL-2.0',
        'MPL-2.0', 'CDDL-1.0', 'CPL-1.0'
    }

    # Licenze GPLv3 compatibili ma NON enterprise-safe (ShareAlike, Copyleft)
    gplv3_only_licenses = {
        'CC-BY-SA-4.0', 'CC-BY-SA-3.0', 'CC-BY-SA-2.0'  # ShareAlike non è enterprise-safe
    }

    # Gestisce dual/multiple licensing
    if ' OR ' in license_upper or ' AND ' in license_upper:
        # Gestisce sia OR che AND - cerca la licenza più permissiva
        delimiters = [' OR ', ' AND ']
        licenses = [license_upper]

        for delimiter in delimiters:
            temp = []
            for lic in licenses:
                temp.extend([l.strip() for l in lic.split(delimiter)])
            licenses = temp

        # Rimuove prefissi e suffissi comuni e normalizza
        cleaned_licenses = []
        for lic in licenses:
            # Rimuove parentesi
            lic = lic.strip('()')
            # Gestisce licenze con versioni specifiche
            if 'CC-BY-4.0' in lic:
                cleaned_licenses.append('CC-BY-4.0')
            elif 'OFL-1.1' in lic:
                cleaned_licenses.append('OFL-1.1')
            elif 'MIT' in lic:
                cleaned_licenses.append('MIT')
            else:
                cleaned_licenses.append(normalize_license_with_version(lic))

        # Sceglie la licenza più permissiva
        for lic in cleaned_licenses:
            lic_upper = lic.upper()
            if lic_upper in gplv3_compatible_licenses and lic_upper not in gplv3_only_licenses:
                return lic, True, True
        for lic in cleaned_licenses:
            lic_upper = lic.upper()
            if lic_upper in gplv3_only_licenses:
                return lic, True, False
        for lic in cleaned_licenses:
            lic_upper = lic.upper()
            if lic_upper in enterprise_safe_licenses:
                return lic, False, True
        return normalized_license, None, None

    # Licenza singola
    if license_upper in gplv3_compatible_licenses and license_upper not in gplv3_only_licenses:
        return normalized_license, True, True
    elif license_upper in gplv3_only_licenses:
        return normalized_license, True, False  # GPLv3 compatibile ma non enterprise-safe
    elif license_upper in enterprise_safe_licenses:
        return normalized_license, False, True
    else:
        return normalized_license, None, None

def process_dependencies(dependencies, exceptions):
    """Processa le dipendenze e applica le eccezioni"""
    processed = []
    excluded_count = 0
    exception_count = 0

    for dep in dependencies:
        name = dep['name']
        exception = matches_exception(name, exceptions)

        if exception and exception.get('exclude_from_reports', False):
            excluded_count += 1
            print(f"  Escluso per eccezione: {name} - {exception['reason']}")
            continue

        # Analisi compatibilità
        chosen_license, gplv3_compat, enterprise_safe = analyze_license_compatibility(dep['license'])

        processed_dep = {
            'name': name,
            'version': dep['version'],
            'license': chosen_license,
            'original_license': dep['license'],
            'gplv3_compatible': gplv3_compat,
            'enterprise_safe': enterprise_safe,
            'has_exception': exception is not None,
            'exception_reason': exception['reason'] if exception else ''
        }

        if exception:
            exception_count += 1
            print(f"  ⚠️ Eccezione gestita: {name} - {chosen_license} - Motivo: {exception['reason']}")

        processed.append(processed_dep)

    return processed, excluded_count, exception_count

def generate_csv_report(data, output_dir):
    """Genera report CSV"""
    os.makedirs(output_dir, exist_ok=True)
    csv_path = os.path.join(output_dir, 'license-artifacts-mapping.csv')

    with open(csv_path, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['Package Name', 'Version', 'License', 'GPLv3 Compatible', 'Enterprise Safe', 'Exception', 'Exception Reason'])

        for artifact in data['artifacts']:
            writer.writerow([
                artifact['name'],
                artifact['version'],
                artifact['license'],
                'Yes' if artifact['gplv3_compatible'] else ('No' if artifact['gplv3_compatible'] is False else 'Unknown'),
                'Yes' if artifact['enterprise_safe'] else ('No' if artifact['enterprise_safe'] is False else 'Unknown'),
                'Yes' if artifact.get('has_exception', False) else '',
                artifact.get('exception_reason', '') or ''
            ])

def generate_html_report(data, output_dir):
    """Genera report HTML migliorato"""
    from collections import defaultdict

    artifacts_by_group = defaultdict(list)
    for artifact in data['artifacts']:
        # Per NPM, raggruppa per scope o prima parte del nome
        if artifact['name'].startswith('@') and '/' in artifact['name']:
            group = artifact['name'].split('/')[0]
        else:
            group = artifact['name'].split('-')[0] if '-' in artifact['name'] else artifact['name'][0].upper()
        artifacts_by_group[group].append(artifact)

    html = f"""<!DOCTYPE html>
<html>
<head>
    <title>NPM License Analysis Report</title>
    <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; margin: 20px; background: #f5f5f5; }}
        .container {{ max-width: 1600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        h1 {{ color: #333; border-bottom: 3px solid #007bff; padding-bottom: 10px; }}
        .summary {{ background: #e8f4ff; padding: 15px; border-radius: 5px; margin-bottom: 20px; border-left: 4px solid #007bff; }}
        .summary-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 10px; }}
        .summary-card {{ background: white; padding: 10px; border-radius: 4px; text-align: center; }}
        .summary-card .number {{ font-size: 2em; font-weight: bold; color: #007bff; }}
        .summary-card .label {{ color: #666; font-size: 0.9em; }}
        .issues {{ background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }}
        .issues h3 {{ margin-top: 0; color: #856404; }}
        .issues ul {{ margin: 10px 0; }}
        table {{ border-collapse: collapse; width: 100%; margin-top: 10px; table-layout: fixed; }}
        th, td {{ border: 1px solid #ddd; padding: 10px; text-align: left; }}
        th {{ background-color: #007bff; color: white; position: sticky; top: 0; z-index: 10; }}
        tr:nth-child(even) {{ background-color: #f9f9f9; }}
        tr:hover {{ background-color: #f0f8ff; }}
        .compatible {{ color: #28a745; font-weight: bold; }}
        .incompatible {{ color: #dc3545; font-weight: bold; }}
        .unknown {{ color: #ffc107; font-weight: bold; }}
        .group-header {{ background: #f8f9fa; font-weight: bold; border-left: 3px solid #007bff; }}

        /* License cell styling */
        .license-cell {{
            max-width: 500px;
            position: relative;
            cursor: pointer;
            word-break: break-word;
        }}
        .license-text {{
            display: block;
            max-height: 3em;
            overflow: hidden;
            transition: max-height 0.3s ease;
        }}
        .license-cell:hover .license-text,
        .license-cell.expanded .license-text {{
            max-height: none;
            background: #fffbf0;
            padding: 5px;
            border-radius: 3px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            position: relative;
            z-index: 5;
        }}
        .copy-button {{
            display: none;
            position: absolute;
            right: 5px;
            top: 5px;
            padding: 3px 8px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
            z-index: 10;
        }}
        .license-cell:hover .copy-button,
        .license-cell.expanded .copy-button {{
            display: inline-block;
        }}
        .copy-button:hover {{
            background: #0056b3;
        }}

        /* Exception cell styling */
        .exception-cell {{
            max-width: 300px;
            position: relative;
            cursor: pointer;
            word-break: break-word;
        }}
        .exception-text {{
            display: block;
            max-height: 3em;
            overflow: hidden;
            transition: max-height 0.3s ease;
        }}
        .exception-cell:hover .exception-text,
        .exception-cell.expanded .exception-text {{
            max-height: none;
            background: #fff9e6;
            padding: 5px;
            border-radius: 3px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            position: relative;
            z-index: 5;
        }}
        .exception-copy-button {{
            display: none;
            position: absolute;
            right: 5px;
            top: 5px;
            padding: 3px 8px;
            background: #856404;
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
            z-index: 10;
        }}
        .exception-cell:hover .exception-copy-button,
        .exception-cell.expanded .exception-copy-button {{
            display: inline-block;
        }}
        .exception-copy-button:hover {{
            background: #6c5229;
        }}

        /* Column widths */
        th:nth-child(1), td:nth-child(1) {{ width: 25%; }}
        th:nth-child(2), td:nth-child(2) {{ width: 10%; }}
        th:nth-child(3), td:nth-child(3) {{ width: 25%; }}
        th:nth-child(4), td:nth-child(4) {{ width: 8%; }}
        th:nth-child(5), td:nth-child(5) {{ width: 8%; }}
        th:nth-child(6), td:nth-child(6) {{ width: 24%; }}

        /* Exception styling */
        .exception-badge {{
            background: #fff3cd;
            color: #856404;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: bold;
            display: inline-block;
            margin-top: 3px;
        }}
        tr.has-exception {{
            background-color: #fff9e6 !important;
        }}
    </style>
    <script>
        function copyToClipboard(text) {{
            navigator.clipboard.writeText(text).then(function() {{
                // Feedback visivo opzionale
            }});
        }}

        function toggleExpand(element) {{
            element.classList.toggle('expanded');
        }}

        document.addEventListener('DOMContentLoaded', function() {{
            // Add click handlers to license cells
            document.querySelectorAll('.license-cell').forEach(function(cell) {{
                cell.addEventListener('click', function(e) {{
                    if (!e.target.classList.contains('copy-button')) {{
                        toggleExpand(this);
                    }}
                }});
            }});

            // Add click handlers to exception cells
            document.querySelectorAll('.exception-cell').forEach(function(cell) {{
                cell.addEventListener('click', function(e) {{
                    if (!e.target.classList.contains('exception-copy-button')) {{
                        toggleExpand(this);
                    }}
                }});
            }});
        }});
    </script>
</head>
<body>
    <div class="container">
        <h1>📊 NPM License Analysis Report</h1>

        <div class="summary">
            <h2>Summary</h2>
            <div class="summary-grid">
                <div class="summary-card">
                    <div class="number">{data['total_artifacts']}</div>
                    <div class="label">Total Packages</div>
                </div>
                <div class="summary-card">
                    <div class="number">{len(data['license_types'])}</div>
                    <div class="label">License Types</div>
                </div>
                <div class="summary-card">
                    <div class="number">{data['compatibility_issues']}</div>
                    <div class="label">Issues</div>
                </div>
                <div class="summary-card">
                    <div class="number">{data['managed_exceptions']}</div>
                    <div class="label">Managed Exceptions</div>
                </div>
            </div>
        </div>
"""

    if data['compatibility_issues'] > 0:
        html += """
        <div class="issues">
            <h3>⚠️ Compatibility Issues</h3>
            <p>The following packages have license compatibility issues:</p>
            <ul>
"""
        for artifact in data['artifacts']:
            if not artifact.get('has_exception', False):
                issues = []
                if not artifact['gplv3_compatible']:
                    issues.append("Not GPLv3 compatible")
                if not artifact['enterprise_safe']:
                    issues.append("Not enterprise-safe (ShareAlike/Copyleft)")
                if issues:
                    html += f"                <li><strong>{artifact['name']}</strong> ({artifact['license']}) - {', '.join(issues)}</li>\n"
        html += """            </ul>
        </div>
"""
    else:
        html += """
        <div class="summary" style="background: #d4edda; border-left-color: #28a745;">
            <h3>✅ No Compatibility Issues</h3>
            <p>All packages are compatible with your licensing requirements or have managed exceptions.</p>
        </div>
"""

    html += """
        <h2>Complete Package Listing</h2>
        <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
            💡 Hover over license or exception cells to view full text. Use Copy button to copy the content.<br>
            ⚠️ Packages with yellow background have managed exceptions.
        </p>
        <table>
            <tr><th>Package Name</th><th>Version</th><th>License</th><th>GPLv3</th><th>Enterprise</th><th>Exception</th></tr>
"""

    for group, artifacts in sorted(artifacts_by_group.items()):
        html += f'<tr class="group-header"><td colspan="6">{html_module.escape(group)} ({len(artifacts)} packages)</td></tr>'

        for artifact in sorted(artifacts, key=lambda x: x['name']):
            gplv3_class = 'compatible' if artifact['gplv3_compatible'] else ('incompatible' if artifact['gplv3_compatible'] is False else 'unknown')
            enterprise_class = 'compatible' if artifact['enterprise_safe'] else ('incompatible' if artifact['enterprise_safe'] is False else 'unknown')
            has_exception = artifact.get('has_exception', False)
            exception_reason = artifact.get('exception_reason', '')
            row_class = 'has-exception' if has_exception else ''

            license_text = artifact['license']
            escaped_license = html_module.escape(license_text)
            escaped_license_js = escaped_license.replace("'", "\\'")

            exception_cell = ''
            if has_exception:
                escaped_reason = html_module.escape(exception_reason)
                escaped_reason_js = escaped_reason.replace("'", "\\'")
                exception_cell = f'''<div class="exception-cell">
                    <span class="exception-badge">EXCEPTION</span><br>
                    <span class="exception-text">{escaped_reason}</span>
                    <button class="exception-copy-button" onclick="copyToClipboard('{escaped_reason_js}')">Copy</button>
                </div>'''

            html += f"""<tr class="{row_class}">
                <td>{html_module.escape(artifact['name'])}</td>
                <td>{html_module.escape(artifact['version'])}</td>
                <td class="license-cell">
                    <span class="license-text">{escaped_license}</span>
                    <button class="copy-button" onclick="copyToClipboard('{escaped_license_js}')">Copy</button>
                </td>
                <td class="{gplv3_class}">{"✅" if artifact['gplv3_compatible'] else ("❌" if artifact['gplv3_compatible'] is False else "❓")}</td>
                <td class="{enterprise_class}">{"✅" if artifact['enterprise_safe'] else ("❌" if artifact['enterprise_safe'] is False else "❓")}</td>
                <td>{exception_cell}</td>
            </tr>"""

    html += """
        </table>
    </div>
</body>
</html>
"""

    html_path = os.path.join(output_dir, 'license-compatibility-report.html')
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)

def generate_markdown_report(data, output_dir):
    """Genera report Markdown"""
    os.makedirs(output_dir, exist_ok=True)
    md_path = os.path.join(output_dir, 'license-compatibility-report.md')

    # Raggruppa per licenza
    licenses_count = defaultdict(int)
    for artifact in data['artifacts']:
        licenses_count[artifact['license']] += 1

    md_content = f"""# 📄 NPM License Compatibility Report

## 📊 Summary
- **Total Packages:** {data['total_artifacts']}
- **License Types:** {len(data['license_types'])}
- **Compatibility Issues:** {data['compatibility_issues']}
- **Managed Exceptions:** {data['managed_exceptions']}

## 📈 License Distribution

| License Type | Count | Percentage |
|-------------|-------|------------|
"""

    for license_type, count in sorted(licenses_count.items(), key=lambda x: x[1], reverse=True):
        percentage = (count / data['total_artifacts'] * 100) if data['total_artifacts'] > 0 else 0
        md_content += f"| {license_type} | {count} | {percentage:.1f}% |\n"

    md_content += f"""
## ⚠️ Compatibility Issues
"""

    if data['compatibility_issues'] == 0:
        md_content += "✅ No compatibility issues detected\n"
    else:
        md_content += "The following packages have compatibility issues:\n\n"
        for artifact in data['artifacts']:
            if not artifact.get('has_exception', False):
                issues = []
                if not artifact['gplv3_compatible']:
                    issues.append("Not GPLv3 compatible")
                if not artifact['enterprise_safe']:
                    issues.append("Not enterprise-safe (ShareAlike/Copyleft)")
                if issues:
                    md_content += f"- **{artifact['name']}** ({artifact['license']}) - {', '.join(issues)}\n"

    # Aggiungi sezione eccezioni gestite
    exceptions = [a for a in data['artifacts'] if a.get('has_exception', False)]
    if exceptions:
        md_content += f"""
## 🔶 Managed Exceptions

The following packages have known compatibility issues but are managed through exceptions:

"""
        for artifact in exceptions:
            md_content += f"""- **{artifact['name']}** ({artifact['license']})
  - Reason: {artifact['exception_reason']}

"""

    md_content += f"""
## 📋 Packages by License Type

"""

    # Raggruppa per tipo di licenza
    artifacts_by_license = defaultdict(list)
    for artifact in data['artifacts']:
        artifacts_by_license[artifact['license']].append(artifact)

    for license_type, artifacts in sorted(artifacts_by_license.items(), key=lambda x: len(x[1]), reverse=True):
        md_content += f"""
### {license_type} ({len(artifacts)} packages)
"""
        shown = 0
        for artifact in sorted(artifacts, key=lambda x: x['name']):
            if shown < 5:
                md_content += f"- {artifact['name']}:{artifact['version']}\n"
                shown += 1

        if len(artifacts) > 5:
            md_content += f"- ... and {len(artifacts) - 5} more\n"

    md_content += f"""
## 🔍 Compatibility Analysis

| Status | GPLv3 Compatible | Enterprise Safe | Count |
|--------|------------------|-----------------|-------|
"""

    compatible_both = len([a for a in data['artifacts'] if a['gplv3_compatible'] and a['enterprise_safe']])
    gplv3_only = len([a for a in data['artifacts'] if a['gplv3_compatible'] and not a['enterprise_safe']])
    enterprise_only = len([a for a in data['artifacts'] if not a['gplv3_compatible'] and a['enterprise_safe']])
    unknown = len([a for a in data['artifacts'] if a['gplv3_compatible'] is None or a['enterprise_safe'] is None])

    md_content += f"| ✅ Compatible with both | Yes | Yes | {compatible_both} |\n"
    if gplv3_only > 0:
        md_content += f"| 🔶 GPLv3 compatible only | Yes | No | {gplv3_only} |\n"
    if enterprise_only > 0:
        md_content += f"| ⚠️ GPLv3 issue only | No | Yes | {enterprise_only} |\n"
    if unknown > 0:
        md_content += f"| ❓ Unknown compatibility | Unknown | Unknown | {unknown} |\n"

    md_content += f"""
---
*Report generated for {data['total_artifacts']} dependencies*
"""

    with open(md_path, 'w', encoding='utf-8') as f:
        f.write(md_content)

def generate_json_report(data, output_dir):
    """Genera report JSON"""
    os.makedirs(output_dir, exist_ok=True)
    json_path = os.path.join(output_dir, 'license-summary.json')

    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def extract_individual_licenses(processed, output_dir):
    """Estrae i file di licenza individuali per ogni pacchetto NPM"""
    import os
    import shutil
    from pathlib import Path

    base_dir = Path(output_dir)
    extracted_count = 0

    print(f"\n🔍 Estrazione file di licenza individuali...")

    for dep in processed:
        name = dep['name']
        version = dep['version']

        # Crea directory per il pacchetto: package-name/version/
        package_dir = base_dir / name / version
        package_dir.mkdir(parents=True, exist_ok=True)

        # Salva metadata del pacchetto
        metadata = {
            'name': name,
            'version': version,
            'license': dep['license'],
            'original_license': dep['original_license'],
            'gplv3_compatible': dep['gplv3_compatible'],
            'enterprise_safe': dep['enterprise_safe'],
            'has_exception': dep['has_exception'],
            'exception_reason': dep['exception_reason']
        }

        metadata_file = package_dir / 'metadata.json'
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)

        # Cerca file di licenza in node_modules
        node_modules_path = Path('node_modules') / name
        if node_modules_path.exists():
            license_patterns = ['LICENSE*', 'LICENCE*', 'license*', 'licence*', 'COPYING*', 'COPYRIGHT*']
            license_found = False

            for pattern in license_patterns:
                license_files = list(node_modules_path.glob(pattern))
                for license_file in license_files:
                    if license_file.is_file():
                        try:
                            dest_file = package_dir / 'LICENSE.txt'
                            shutil.copy2(license_file, dest_file)
                            print(f"  ✅ {name}: {license_file.name}")
                            license_found = True
                            extracted_count += 1
                            break
                        except Exception as e:
                            print(f"  ❌ Errore copiando licenza per {name}: {e}")

                if license_found:
                    break

            if not license_found:
                # Crea placeholder
                placeholder_content = f"""License information for {name} v{version}

License: {dep['license']}
Original License Field: {dep['original_license']}

No license file found in node_modules/{name}/
License information extracted from package.json metadata.

For full license text, please visit:
https://www.npmjs.com/package/{name}
"""
                placeholder_file = package_dir / 'LICENSE.txt'
                with open(placeholder_file, 'w', encoding='utf-8') as f:
                    f.write(placeholder_content)
                print(f"  📝 {name}: placeholder creato")

    print(f"\n📁 Estrazione completata: {extracted_count} file estratti")

def main():
    parser = argparse.ArgumentParser(description='Analisi licenze dipendenze NPM')
    parser.add_argument('--exceptions', default='license-exceptions.json',
                       help='File JSON con le eccezioni (default: license-exceptions.json)')
    args = parser.parse_args()

    print("Estrazione dipendenze NPM...")
    npm_data = get_npm_dependencies()
    if not npm_data:
        print("❌ Errore nell'estrazione delle dipendenze NPM")
        sys.exit(1)

    dependencies = flatten_dependencies(npm_data)
    total_deps = len(dependencies)
    print(f"Trovate {total_deps} dipendenze totali")

    # Carica eccezioni
    exceptions = load_exceptions(args.exceptions)
    print(f"Caricate {len(exceptions)} eccezioni dal file {args.exceptions}")

    # Processa dipendenze
    processed, excluded_count, exception_count = process_dependencies(dependencies, exceptions)
    processed_count = len(processed)

    print(f"Dipendenze dopo esclusioni: {processed_count} ({excluded_count} escluse per eccezione)")

    # Verifica problemi di compatibilità
    gplv3_issues = 0
    enterprise_issues = 0
    for dep in processed:
        if not dep.get('has_exception', False):
            if not dep['gplv3_compatible']:
                gplv3_issues += 1
            if not dep['enterprise_safe']:
                enterprise_issues += 1

    total_compatibility_issues = gplv3_issues + enterprise_issues

    # Conta tipi di licenza
    license_types = set(dep['license'] for dep in processed)

    # Prepara dati per report (mantiene compatibilità con i template esistenti)
    report_data = {
        'total_artifacts': processed_count,
        'excluded_artifacts': excluded_count,
        'managed_exceptions': exception_count,
        'license_types': sorted(list(license_types)),
        'compatibility_issues': total_compatibility_issues,  # Include tutti i problemi
        'gplv3_issues': gplv3_issues,
        'enterprise_issues': enterprise_issues,
        'total_issues': total_compatibility_issues,
        'artifacts': processed
    }

    # Genera report
    output_dir = 'third-party-licenses'
    print(f"Generazione report in: {output_dir}/")

    generate_csv_report(report_data, output_dir)
    generate_html_report(report_data, output_dir)
    generate_markdown_report(report_data, output_dir)
    generate_json_report(report_data, output_dir)

    # Estrai file di licenza individuali
    extract_individual_licenses(processed, output_dir)

    print("\nAnalisi completata:")
    print(f"  - Packages processati: {processed_count}")
    print(f"  - Tipi di licenza trovati: {len(license_types)}")
    print(f"  - Problemi GPLv3 NON gestiti: {gplv3_issues}")
    print(f"  - Problemi Enterprise NON gestiti: {enterprise_issues}")
    print(f"  - Report salvati in: {output_dir}/")

    if total_compatibility_issues == 0:
        print("\n✅ Tutte le licenze sono compatibili o gestite tramite eccezioni")
        sys.exit(0)
    else:
        error_messages = []
        if gplv3_issues > 0:
            error_messages.append(f"{gplv3_issues} problemi di compatibilità GPLv3")
        if enterprise_issues > 0:
            error_messages.append(f"{enterprise_issues} problemi di compatibilità Enterprise (ShareAlike/Copyleft)")

        print(f"\n❌ Trovati: {' e '.join(error_messages)}")
        sys.exit(1)

if __name__ == '__main__':
    main()