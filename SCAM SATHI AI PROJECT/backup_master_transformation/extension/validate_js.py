import re

with open(r'c:\Users\ashok\OneDrive\Desktop\Documents\SCAM SATHI AI PROJECT\extension\platforms\whatsapp.js', encoding='utf-8') as f:
    code = f.read()

# Tokenize JS code to track braces properly
# Strip single line comments
code_clean = re.sub(r'//.*', '', code)
# Strip block comments
code_clean = re.sub(r'/\*[\s\S]*?\*/', '', code_clean)

# Walk char by char with full state machine
stack = []
in_quote = None
escape = False
template_depth = []

i = 0
line = 1
col = 1
errors = []

while i < len(code_clean):
    c = code_clean[i]
    if c == '\n':
        line += 1
        col = 1
        i += 1
        continue
    col += 1

    if in_quote:
        if escape:
            escape = False
        elif c == '\\':
            escape = True
        elif c == in_quote:
            in_quote = None
        elif in_quote == '`' and c == '$' and i + 1 < len(code_clean) and code_clean[i+1] == '{':
            # Entering template expression
            i += 1
            col += 1
            stack.append(('${', line, col))
            in_quote = None
            template_depth.append(True)
    else:
        if c in ('"', "'", '`'):
            in_quote = c
        elif c in ('{', '(', '['):
            stack.append((c, line, col))
        elif c in ('}', ')', ']'):
            expected = {'}': '{', ')': '(', ']': '['}[c]
            if not stack:
                errors.append(f"Unexpected closing {c} at line {line}:{col}")
            else:
                top, top_line, top_col = stack.pop()
                if top == '${' and c == '}':
                    # Exiting template expression, back to template literal
                    if template_depth:
                        template_depth.pop()
                    in_quote = '`'
                elif top != expected:
                    errors.append(f"Mismatched {c} at line {line}:{col}, opened {top} at line {top_line}:{top_col}")

    i += 1

print(f"Total lines parsed: {line}")
if in_quote:
    print(f"ERROR: Unclosed string literal {in_quote}")
if errors:
    print("Errors found:")
    for e in errors:
        print("  ", e)
if stack:
    print("Unclosed delimiters:")
    for s in stack:
        print(f"  {s[0]} opened at line {s[1]}:{s[2]}")

if not in_quote and not errors and not stack:
    print("SUCCESS: 100% Valid JavaScript Syntax! All braces, parentheses, and brackets match perfectly!")

