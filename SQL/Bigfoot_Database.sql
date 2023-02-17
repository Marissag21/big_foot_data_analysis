-- Create a new table
CREATE TABLE bigfoot (
  Number INT,
  County VARCHAR(40) NOT NULL,
  State VARCHAR(40) NOT NULL,
  Latitude DEC,
  Longitude DEC,
  Classification VARCHAR(40) NOT NULL,
  Date VARCHAR(40) NOT NULL,
  Season VARCHAR(40) NOT NULL,
  Temperature INT,
  Humidity DEC,
  Cloud_cover DEC,
  Precip_intensity DEC,
  Visibility DEC,
  Pressure DEC,
  Wind_speed DEC,
  Observed VARCHAR(10000) NOT NULL
);

SELECT *
FROM bigfoot;
