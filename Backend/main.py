from flask import Flask, jsonify, redirect, render_template, request, session, url_for
import requests
import base64
import os
import webbrowser
from threading import Timer
# instance of flask application
app = Flask(__name__)
# Use environment variables for deployment
app.config['SPOTIFY_CLIENT_ID'] = '7fa25326cd8a4540ab9801dd5d4e3118'
app.config['SPOTIFY_CLIENT_SECRET'] = '0fd7a582ec834c8c94d2433331d07bfe'
app.config['SPOTIFY_REDIRECT_URI'] = 'http://localhost:5000/callback'
app.secret_key = os.urandom(24)  # Add a secret key for session management


#route to go to home page
@app.route('/')
def home():
    return render_template('loginPage.html')
#go to game page 
@app.route('/gamePage')
def goToGame():
    return render_template('postGamePage.html')

#go to settings page 
@app.route('/settingsPage')
def goToSettings():
    return render_template('settingsPage.html')

#route to have user login to spotify account 
@app.route('/login')
def login():
    print("Login route accessed")
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
    return redirect(url_for('dashboard'))

@app.route('/playlists')
def get_user_playlists():
    access_token = session.get('access_token')
    if access_token:
        api_url = "https://api.spotify.com/v1/me/playlists"
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        response = requests.get(api_url, headers=headers)
        if response.status_code == 200:
            #create object with playlist items 
            playlists = response.json()
            return jsonify(playlists)
        else:
            return jsonify({"error": "Failed to fetch user playlists"}), response.status_code
    else:
        return redirect(url_for('home'))


@app.route('/dashboard')
def dashboard():
    access_token = session.get('access_token')
    if access_token:
        # Use the access token to make a request to the Spotify API
        api_url = "https://api.spotify.com/v1/me"
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        api_response = requests.get(api_url, headers=headers)
        user_info = api_response.json()
        
        return render_template('dashboard.html', access_token=access_token, user_info=user_info)
    else:
        return redirect(url_for('home'))
    
@app.route('/playlist/<playlist_id>/tracks')
def get_playlist_tracks(playlist_id):
    access_token = session.get('access_token')
    if access_token:
        api_url = f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks"
        headers = {
            "Authorization": f"Bearer {access_token}"
        }
        response = requests.get(api_url, headers=headers)
        if response.status_code == 200:
            tracks = response.json()
            return jsonify(tracks)
        else:
            return jsonify({"error": "Failed to fetch playlist tracks"}), response.status_code
    else:
        return redirect(url_for('home'))

# Function to open a web browser
def open_browser():
    webbrowser.open_new_tab("http://127.0.0.1:5000/")
if __name__ == '__main__':
    # Set a timer to open the browser after a short delay
    Timer(1, open_browser).start()
    app.run(debug=True)