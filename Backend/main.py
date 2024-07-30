from flask import Flask, jsonify, redirect, render_template, request, session, url_for
import requests
import base64
import os
import webbrowser
from threading import Timer
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

# Instance of flask application
app = Flask(__name__)
# Use environment variables for deployment
app.config['SPOTIFY_CLIENT_ID'] = '7fa25326cd8a4540ab9801dd5d4e3118'
app.config['SPOTIFY_CLIENT_SECRET'] = '0fd7a582ec834c8c94d2433331d07bfe'
app.config['SPOTIFY_REDIRECT_URI'] = 'http://localhost:5000/callback'
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:password@localhost/spotifyGame'  # Use MySQL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.secret_key = os.urandom(24)  # Add a secret key for session management

db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    spotify_id = db.Column(db.String(50), unique=True, nullable=False)
    username = db.Column(db.String(50), unique=True, nullable=False)
@app.before_request
def create_tables():
    # The following line will remove this handler, making it
    # only run on the first request
    app.before_request_funcs[None].remove(create_tables)

    db.create_all()


# Route to go to home page
@app.route('/')
def home():
    return render_template('loginPage.html')

# Go to game page 
@app.route('/gamePage')
def goToGame():
    return render_template('postGamePage.html')

# Route to have user login to Spotify account 
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
    
    # Fetch user information from Spotify
    access_token = token_info['access_token']
    api_url = "https://api.spotify.com/v1/me"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    api_response = requests.get(api_url, headers=headers)
    user_info = api_response.json()
    
    # Store user information in the database
    spotify_id = user_info['id']
    username = user_info['display_name'] or user_info['id']  # Fallback to user ID if display name is not available
    
    # Check if the user already exists
    user = User.query.filter_by(spotify_id=spotify_id).first()
    if not user:
        user = User(spotify_id=spotify_id, username=username)
        db.session.add(user)
        db.session.commit()
    
    session['user_id'] = user.id
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
    Timer(1, open_browser).start()
    app.run(debug=True)
