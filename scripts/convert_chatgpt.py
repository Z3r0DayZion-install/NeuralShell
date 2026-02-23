import json
import sys
import os

def convert_conversations(input_file, output_file):
    """
    Converts ChatGPT export (conversations.json) to ShareGPT JSONL format for training.
    """
    print(f"Reading {input_file}...")
    
    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            conversations = json.load(f)
    except Exception as e:
        print(f"❌ ERROR reading file: {e}")
        return

    print(f"Found {len(conversations)} conversations.")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        count = 0
        for convo in conversations:
            messages = []
            
            # Navigate the conversation tree (simplified linear path)
            current_node = convo.get('current_node')
            mapping = convo.get('mapping', {})
            
            while current_node:
                node = mapping.get(current_node)
                if not node: break
                
                message = node.get('message')
                if message and message.get('content') and message['content'].get('parts'):
                    role = message['author']['role']
                    # Some messages have list parts, some have strings
                    parts = message['content']['parts']
                    content = "".join([str(p) for p in parts if isinstance(p, (str, int, float))])
                    
                    if content.strip():
                        if role == 'user':
                            messages.insert(0, {"from": "human", "value": content})
                        elif role == 'assistant':
                            messages.insert(0, {"from": "gpt", "value": content})
                
                current_node = node.get('parent')

            if messages:
                json.dump({"conversations": messages}, f)
                f.write('\n')
                count += 1

    print(f"✅ Successfully converted {count} conversations to {output_file}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python convert_chatgpt.py <conversations.json> <output.jsonl>")
        sys.exit(1)
        
    convert_conversations(sys.argv[1], sys.argv[2])
