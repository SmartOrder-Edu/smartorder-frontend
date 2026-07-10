import re

vue_path = r"d:\develop\code\smartorder\smartorder-frontend\src\views\Exam\index.vue"

with open(vue_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 截取 <template> ... </template>
start_idx = content.find("<template>")
end_idx = content.rfind("</template>") # 使用 rfind 找到最后一个

if start_idx == -1 or end_idx == -1:
    print("No template found!")
    exit(1)

template_str = content[start_idx + 10:end_idx]

# 过滤注释
template_str = re.sub(r'<!--.*?-->', '', template_str, flags=re.DOTALL)

# 寻找所有 <...> 格式的标签，允许跨行
tag_regex = re.compile(r'<(/?[a-zA-Z0-9_-]+)(?:\s+[^>]*?)?(/?)>', re.DOTALL)

stack = []
self_closing = {
    'input', 'img', 'br', 'hr', 'meta', 'link', 'circle', 'path', 'rect', 'ellipse',
    'polygon', 'line', 'defs', 'linearGradient', 'stop', 'use'
}

# 辅助函数：根据字符索引计算行号
def get_line_no(s, index):
    return s[:index].count('\n') + 1

# 找到所有的 tags 并排序
matches = list(tag_regex.finditer(template_str))

for m in matches:
    tag_name = m.group(1)
    is_close = tag_name.startswith('/')
    is_self = m.group(2) == '/' or tag_name.lower().replace('/', '') in self_closing
    
    normalized_name = tag_name.replace('/', '').lower()
    char_index = m.start()
    line_idx = get_line_no(template_str, char_index)
    
    if is_self:
        continue
        
    if is_close:
        if not stack:
            print(f"Error: Closed tag </{normalized_name}> at line {line_idx} but stack is empty!")
        else:
            top_name, top_line = stack.pop()
            if top_name != normalized_name:
                print(f"Error: Closed tag </{normalized_name}> at line {line_idx} does not match open tag <{top_name}> from line {top_line}!")
    else:
        stack.append((normalized_name, line_idx))

if stack:
    print("Unclosed tags remaining in stack:")
    for tag_name, line in stack:
        print(f"  <{tag_name}> from line {line}")
else:
    print("All tags matched successfully!")
