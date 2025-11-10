from flask import Flask, send_file
import os

app = Flask(__name__)

@app.route('/test')
def test_page():
    return send_file('debug_canvas.html')

if __name__ == '__main__':
    app.run(debug=True, port=5001)