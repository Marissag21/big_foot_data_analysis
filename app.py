# import dependencies
from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.ext.automap import automap_base
import psycopg2

#create engine
engine = create_engine("sqlite:///Resources/big_data.sqlite") 
# Base = automap_base()
# Base.prepare()
# Bigfoot = Base.classes

# create connection
conn = engine.raw_connection()
cursor = conn.cursor()


#create an app
app = Flask(__name__) 


# create home route
@app.route("/")
def home():
     return render_template('index.html')

#create data route
@app.route("/data")
def data():
     cursor.execute('SELECT * FROM bigfoot')
     return(cursor.fetchall())



     

if __name__ == "__main__":
     app.run(port =5000, debug=True)
