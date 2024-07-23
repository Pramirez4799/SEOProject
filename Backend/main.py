from flask import Flask, redirect
from flask import request, jsonify
# instance of flask application
app = Flask(__name__)
# Use environment variables for deployment
app.config['SPOTIFY_CLIENT_ID'] = '7fa25326cd8a4540ab9801dd5d4e3118'
app.config['SPOTIFY_CLIENT_SECRET'] = '0fd7a582ec834c8c94d2433331d07bfe'
app.config['SPOTIFY_REDIRECT_URI'] = 'http://localhost:5000/callback'

#route to have user login to spotify account 
@app.route('/login')
def login():
    auth_url = (
        'https://accounts.spotify.com/authorize'
        '?response_type=code'
        f'&client_id={app.config["SPOTIFY_CLIENT_ID"]}'
        f'&redirect_uri={app.config["SPOTIFY_REDIRECT_URI"]}'
        '&scope=playlist-read-private'
    )
    return redirect(auth_url)

@app.route('/callback')
def callback():
    code = request.args.get('code')
    token_url = 'https://accounts.spotify.com/api/token'
    headers = {
        'Authorization': 'Basic ' + base64.b64encode(f"{app.config['SPOTIFY_CLIENT_ID']}:{app.config['SPOTIFY_CLIENT_SECRET']}".encode()).decode(),
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    data = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': app.config['SPOTIFY_REDIRECT_URI']
    }
    response = requests.post(token_url, headers=headers, data=data)
    token_info = response.json()
    session['access_token'] = token_info['access_token']
    return redirect(url_for('index'))

@app.route('/')
def hello_world():
    return 'Hello, World!'

if __name__ == '__main__':
    app.run(debug=True)
