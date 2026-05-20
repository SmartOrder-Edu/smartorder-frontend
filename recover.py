import json
import re

log_path = r'C:\Users\1\.gemini\antigravity\brain\19070ae7-63ac-41a0-9d84-71ceafd83963\.system_generated\logs\transcript.jsonl'

idx_len = 0
idx_content = ''
prev_len = 0
prev_content = ''

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            content = data.get('content', '')
            if content and '<file ' in content:
                # 寻找所有 file 块
                matches = re.findall(r'<file\s+path=[\'\"]([^\'\"]+?)[\'\"]\s*>(.*?)</file>', content, re.DOTALL)
                for path, text in matches:
                    if 'index.vue' in path and len(text) > idx_len:
                        idx_len = len(text)
                        idx_content = text
                    if 'preview.vue' in path and len(text) > prev_len:
                        prev_len = len(text)
                        prev_content = text
        except Exception:
            pass

print('Found index.vue length:', idx_len)
if idx_len > 0:
    with open(r'd:\develop\code\smartorder\smartorder-frontend\src\views\CloudDrive\index_recovered.vue', 'w', encoding='utf-8') as f:
        f.write(idx_content)

print('Found preview.vue length:', prev_len)
if prev_len > 0:
    with open(r'd:\develop\code\smartorder\smartorder-frontend\src\views\CloudDrive\preview_recovered.vue', 'w', encoding='utf-8') as f:
        f.write(prev_content)
