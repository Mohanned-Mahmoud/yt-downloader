from flask import Flask, render_template_string, request, send_file
import yt_dlp
import os

app = Flask(__name__)

# واجهة بسيطة جداً جوه الكود عشان منعملش ملفات كتير
HTML_TEMPLATE = """
<!DOCTYPE html>
<html dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>محول يوتيوب</title>
    <style>
        body { font-family: sans-serif; text-align: center; padding: 50px; background: #f0f2f5; }
        input { padding: 15px; width: 60%; border-radius: 8px; border: 1px solid #ccc; margin-bottom: 10px; }
        button { padding: 15px 30px; background: #ff0000; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; }
        button:hover { background: #cc0000; }
    </style>
</head>
<body>
    <h1>تحميل صوت من يوتيوب 🎵</h1>
    <form action="/download" method="post">
        <input type="text" name="url" placeholder="حط اللينك هنا..." required>
        <br>
        <button type="submit">تحميل MP3</button>
    </form>
</body>
</html>
"""

@app.route('/')
def home():
    return render_template_string(HTML_TEMPLATE)

@app.route('/download', methods=['POST'])
def download():
    url = request.form['url']
    try:
        # استخدام cookies عشان نتجنب الحظر (اختياري بس مستحسن)
        ydl_opts = {
            'format': 'bestaudio/best',
            'postprocessors': [{'key': 'FFmpegExtractAudio','preferredcodec': 'mp3','preferredquality': '192'}],
            'outtmpl': '/tmp/%(title)s.%(ext)s', # التحميل في فولدر المؤقتات
            'nocheckcertificate': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info).rsplit('.', 1)[0] + '.mp3'
            
        return send_file(filename, as_attachment=True)
    except Exception as e:
        return f"حدث خطأ: {str(e)}"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
