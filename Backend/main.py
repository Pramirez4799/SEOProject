from flask import Flask, jsonify, redirect, render_template, request, session, url_for
import requests
import base64
import os
import webbrowser
from threading import Timer
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import null
from werkzeug.security import generate_password_hash, check_password_hash

# Instance of flask application
app = Flask(__name__)
# Use environment variables for deployment
app.config['SPOTIFY_CLIENT_ID'] = '7fa25326cd8a4540ab9801dd5d4e3118'
app.config['SPOTIFY_CLIENT_SECRET'] = '0fd7a582ec834c8c94d2433331d07bfe'
app.config['SPOTIFY_REDIRECT_URI'] = 'http://localhost:5000/callback'
# app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:password@localhost/spotifyGame'  # Use MySQL
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:Abc123!%40@127.0.0.1:3306/spotifyGame' # Use MySQL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.secret_key = os.urandom(24)  # Add a secret key for session management

db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    spotify_id = db.Column(db.String(50), nullable=False)
    highest_score = db.Column(db.Integer, default=0)
    average_score = db.Column(db.Float, default=0.0)
    correctGuesses = db.Column(db.Integer, default=0)
    totalSongs = db.Column(db.Integer, default=0)
    accuracy = db.Column(db.Float, default=0.0)
    games_played = db.Column(db.Integer, default=0)

    def __init__(self, spotify_id, highest_score=0, average_score=0.0, accuracy=0.0, games_played=0, totalSongs=0, correctGuesses=0):
        self.spotify_id = spotify_id
        self.highest_score = highest_score
        self.average_score = average_score
        self.accuracy = accuracy
        self.games_played = games_played
        self.totalSongs = totalSongs
        self.correctGuesses = correctGuesses
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
# Route to go to leaderboard page 
@app.route('/leaderboard')
def goToleaderBoard():
    return render_template('leaderBoard.html')

# Go to game page 
@app.route('/gamePage')
def goToGame():
    return render_template('postGamePage.html')
@app.route('/logout')
def logout():
    # Clear the session data
    session.pop('spotify_token', None)
    session.pop('user_info', None)
    # Redirect to the login page
    return render_template('loginPage.html')
@app.route('/settings')
def goToSettings():
    # Retrieve Spotify ID from the session
    spotify_id = session.get('spotify_id', 'Unknown')
    
    # Use spotify_id as needed
    return render_template('settingsPage.html', spotify_id=spotify_id)

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
    
    # Fetch user information from Spotify
    access_token = token_info['access_token']
    api_url = "https://api.spotify.com/v1/me"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    api_response = requests.get(api_url, headers=headers)
    #get all of user info
    user_info = api_response.json()
    
    # get spotify id from user_info
    spotify_id = user_info['id']
     # Store Spotify ID in the session
    session['spotify_id'] = spotify_id
    # Check if the user already exists
    user = User.query.filter_by(spotify_id=spotify_id).first()
    if not user:
        user = User(spotify_id=spotify_id)
        db.session.add(user)
        db.session.commit()
    
    # Store the username
    session['user_id'] = user.id
    return redirect(url_for('goToSettings'))

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
#update sql database 
@app.route('/update_metrics', methods=['POST'])
def update_metrics():
    data = request.json
    spotify_id = data.get('spotify_id')
    new_score = data.get('last_score')
    totalSongs = data.get('totalSongs')
    correctGuesses = data.get('correctGuesses')
    
    # Find user by username
    user = User.query.filter_by(spotify_id=spotify_id).first()
    if user:
        # Update metrics
        if user.highest_score is None or new_score > user.highest_score:
            user.highest_score = new_score
        
        total_scores = (user.average_score * user.games_played) + new_score
        user.games_played += 1
        user.average_score = total_scores / user.games_played
        user.totalSongs = user.totalSongs + totalSongs
        user.correctGuesses = user.correctGuesses + correctGuesses
        if user.correctGuesses > 0:
            user.accuracy = user.correctGuesses / user.totalSongs
        else:
            user.accuracy = 0  # or some default value
        
        db.session.commit()
        return jsonify({'message': 'Metrics updated successfully'}), 200
    else:
        return jsonify({'message': 'User not found'}), 404

# POST route to add a new user
@app.route('/add_user', methods=['POST'])
def add_user():
    try:
        # Parse JSON data from request
        data = request.json
        spotify_id = data.get('spotify_id')

        # Check if the Spotify ID is provided
        if not spotify_id:
            return jsonify({'message': 'Spotify ID is required'}), 400

        # Create a new user instance
        new_user = User(spotify_id=spotify_id)

        # Add the new user to the session and commit to the database
        db.session.add(new_user)
        db.session.commit()

        return jsonify({'message': 'User added successfully'}), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/users', methods=['GET'])
def get_all_users():
    try:
        # Query the database and order users by their highest score in descending order
        users = User.query.order_by(User.highest_score.desc()).all()

        # Prepare the user data for JSON response with dynamic ranking
        user_data = [
            {
                "spotify_id": user.spotify_id,
                "ranking": index + 1,  # Calculate ranking based on index after sorting
                "highest_score": user.highest_score,
                "average_score": user.average_score,
                "accuracy": user.accuracy * 100,  # Convert accuracy to percentage
                "games_played": user.games_played,
                "total_songs": user.totalSongs,
                "correct_guesses": user.correctGuesses
            }
            for index, user in enumerate(users)
        ]

        return jsonify(user_data), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    # Timer(1, open_browser).start()
    app.run(debug=True)
