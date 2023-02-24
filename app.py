# import dependencies
from flask import Flask, render_template, jsonify
from sqlalchemy import create_engine
import sqlite3
import pandas as pd
from flask_sqlalchemy import SQLAlchemy

#create engine
engine = create_engine("sqlite:///Resources/big_data.sqlite?check_same_thread=False") 

# create connection
conn = engine.raw_connection()
cursor = conn.cursor()

#create an app
app = Flask(__name__) 

# create home route
@app.route("/")
def home():
     return render_template('index.html')

#create data route with SQL data JSONified
@app.route("/data")
def data():
     cursor.execute('SELECT * FROM bigfoot')
     data = (cursor.fetchall())
     data = pd.DataFrame(data, columns = ["Number", "County", "State", "Latitude", "Longitude", "Classification", "Date", "Season", "Temperature", "Humidity", "Cloud_cover", "Precip_intensity", "Visibility", "Pressure", "Wind_speed", "Observed"])
     data = data.to_json(orient = "records")
     return render_template('data.html', jsondata = data)

if __name__ == "__main__":
     app.run(port =5000, debug=True)
