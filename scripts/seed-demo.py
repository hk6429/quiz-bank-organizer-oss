#!/usr/bin/env python3
"""
匯入 10 題通用範例（國中國文 / 數學 / 自然 各 3-4 題）到 Sheets。
跑之前先填好 .env.local 的 SHEETS_API_URL + SHEETS_API_SECRET。

Usage:
  python3 scripts/seed-demo.py
"""
import json
import os
import sys
import urllib.request
from pathlib import Path


def load_env():
    env_path = Path(__file__).resolve().parent.parent / ".env.local"
    if not env_path.exists():
        print("✗ .env.local 不存在。先複製 .env.example 並填好三個值。")
        sys.exit(1)
    env = {}
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip().strip('"').strip("'")
    return env


DEMO_QUESTIONS = [
    # ── 國文 ──
    {
        "subject": "CHI", "grade": "G8", "unit": "現代散文",
        "type": "single", "difficulty": "easy", "bloom": "理解",
        "stem": "「他望著窗外，眼神空洞」這句話最主要在描寫人物的什麼？",
        "options": ["外貌", "情緒", "動作", "對話"],
        "answer": "B", "explanation": "「眼神空洞」是內在情緒的外顯描寫。",
    },
    {
        "subject": "CHI", "grade": "G8", "unit": "古文",
        "type": "single", "difficulty": "medium", "bloom": "應用",
        "stem": "「不入虎穴，焉得虎子」這句話的「焉」字最接近下列哪個字義？",
        "options": ["怎麼", "於是", "在哪裡", "於此"],
        "answer": "A", "explanation": "「焉」在此處作疑問副詞「怎麼、如何」解。",
    },
    {
        "subject": "CHI", "grade": "G8", "unit": "修辭",
        "type": "single", "difficulty": "medium", "bloom": "分析",
        "stem": "「月光像一條銀色的河流，灑在屋瓦上」這句話運用了哪種修辭？",
        "options": ["擬人", "誇飾", "譬喻", "對偶"],
        "answer": "C", "explanation": "「月光像銀色河流」是明喻，屬於譬喻法。",
    },
    {
        "subject": "CHI", "grade": "G8", "unit": "詩詞",
        "type": "single", "difficulty": "hard", "bloom": "分析",
        "stem": "李白〈靜夜思〉「舉頭望明月，低頭思故鄉」最能展現詩人哪種情感？",
        "options": ["豪邁壯志", "思鄉之情", "閒適自得", "懷才不遇"],
        "answer": "B", "explanation": "由「思故鄉」三字直接點明主題。",
    },
    # ── 數學 ──
    {
        "subject": "MAT", "grade": "G8", "unit": "一元一次方程式",
        "type": "single", "difficulty": "easy", "bloom": "應用",
        "stem": "若 3x − 7 = 2，則 x 之值為何？",
        "options": ["1", "2", "3", "4"],
        "answer": "C", "explanation": "3x = 9，所以 x = 3。",
    },
    {
        "subject": "MAT", "grade": "G8", "unit": "平方根",
        "type": "single", "difficulty": "medium", "bloom": "應用",
        "stem": "√48 化簡後等於下列何者？",
        "options": ["4√3", "3√4", "2√12", "6√2"],
        "answer": "A", "explanation": "√48 = √(16×3) = 4√3。",
    },
    {
        "subject": "MAT", "grade": "G8", "unit": "幾何",
        "type": "single", "difficulty": "medium", "bloom": "應用",
        "stem": "直角三角形兩股長 3 公分、4 公分，斜邊長為何？",
        "options": ["5 公分", "6 公分", "7 公分", "12 公分"],
        "answer": "A", "explanation": "由畢氏定理：3² + 4² = 25 = 5²。",
    },
    # ── 自然 ──
    {
        "subject": "SCI", "grade": "G8", "unit": "物質的變化",
        "type": "single", "difficulty": "easy", "bloom": "理解",
        "stem": "下列何者屬於化學變化？",
        "options": ["冰塊融化", "水蒸發", "鐵生鏽", "糖溶於水"],
        "answer": "C", "explanation": "鐵生鏽產生氧化鐵，是新物質，屬化學變化。",
    },
    {
        "subject": "SCI", "grade": "G8", "unit": "力與運動",
        "type": "single", "difficulty": "medium", "bloom": "應用",
        "stem": "質量 2 公斤的物體受到 10 牛頓的合力，產生的加速度為何？",
        "options": ["2 m/s²", "5 m/s²", "10 m/s²", "20 m/s²"],
        "answer": "B", "explanation": "牛頓第二定律 F=ma，a = 10/2 = 5 m/s²。",
    },
    {
        "subject": "SCI", "grade": "G8", "unit": "生物",
        "type": "single", "difficulty": "easy", "bloom": "記憶",
        "stem": "植物進行光合作用主要的場所是？",
        "options": ["細胞壁", "葉綠體", "粒線體", "細胞核"],
        "answer": "B", "explanation": "葉綠體內含葉綠素，是光合作用的主要場所。",
    },
]


def main():
    env = load_env()
    url = env.get("SHEETS_API_URL")
    secret = env.get("SHEETS_API_SECRET")
    if not url or not secret:
        print("✗ .env.local 缺 SHEETS_API_URL 或 SHEETS_API_SECRET")
        sys.exit(1)

    full_url = f"{url}?secret={secret}"
    print(f"→ 匯入 {len(DEMO_QUESTIONS)} 題到 Sheets ...")
    for i, q in enumerate(DEMO_QUESTIONS, 1):
        payload = {"action": "create", "question": {**q, "status": "已審", "reviewer": "demo-seed"}}
        req = urllib.request.Request(
            full_url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8")
            try:
                result = json.loads(body)
                if result.get("ok"):
                    print(f"  [{i:02d}] ✓ {q['subject']} {q['stem'][:30]}…")
                else:
                    print(f"  [{i:02d}] ✗ {result}")
            except Exception:
                print(f"  [{i:02d}] ⚠ 回應非 JSON：{body[:80]}")

    print(f"\n✓ 完成。打開 /questions 看結果。")


if __name__ == "__main__":
    main()
