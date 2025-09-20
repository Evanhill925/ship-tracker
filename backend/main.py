import asyncio
import websockets
import json
from datetime import datetime, timezone
import os
from pymongo import MongoClient

from dotenv import load_dotenv, dotenv_values
# loading variables from .env file
load_dotenv()

SHIPKEY = os.getenv('SHIPKEY')
DB_URI = os.getenv('DB_URI')

# Initialize MongoDB connection
try:
    client = MongoClient(DB_URI)
    db = client['ship-tracker']  # Database name from your URI
    ships_collection = db['static-ships']  # Collection name from shipSchema.js
    positions_collection = db['position-reports']  # Collection name from positionSchema.js
    
    # Test the connection
    client.admin.command('ping')
    print(f"[{datetime.now(timezone.utc)}] Successfully connected to MongoDB!")
except Exception as e:
    print(f"[{datetime.now(timezone.utc)}] Failed to connect to MongoDB: {e}")
    exit(1)

async def connect_ais_stream():

    async with websockets.connect("wss://stream.aisstream.io/v0/stream") as websocket:
        subscribe_message={
        "APIKey": SHIPKEY,
        "BoundingBoxes": [[[1.15, 103.55], [1.50, 104.10]],   # Singapore 
                        [[24.0, 122.0], [46.0, 146.0]]],  # Japan
       'FilterMessageTypes': ['PositionReport','ShipStaticData']
            }

        subscribe_message_json = json.dumps(subscribe_message)
        await websocket.send(subscribe_message_json)
        known_ships = []

        async for message_json in websocket:
            message = json.loads(message_json)
            message_type = message["MessageType"]

            


            # the message parameter contains a key of the message type which contains the message itself
            if message_type == 'ShipStaticData':
                ais_message = message['Message']['ShipStaticData']
                if ais_message['Type'] in [70,80]:
                    if ais_message['UserID'] in known_ships:
                        pass
                    else:
                        # Create ship document matching your shipSchema.js structure
                        ship_document = {
                            'MessageID': ais_message.get('MessageID'),
                            'RepeatIndicator': ais_message.get('RepeatIndicator'),
                            'UserID': ais_message.get('UserID'),
                            'Valid': ais_message.get('Valid'),
                            'AisVersion': ais_message.get('AisVersion'),
                            'ImoNumber': ais_message.get('ImoNumber'),
                            'CallSign': ais_message.get('CallSign'),
                            'Name': ais_message.get('Name'),
                            'Type': ais_message.get('Type'),
                            'Dimension': ais_message.get('Dimension'),
                            'FixType': ais_message.get('FixType'),
                            'Eta': ais_message.get('Eta'),
                            'MaximumStaticDraught': ais_message.get('MaximumStaticDraught'),
                            'Destination': ais_message.get('Destination'),
                            'Dte': ais_message.get('Dte'),
                            'Spare': ais_message.get('Spare'),
                            'timestamp': datetime.now(timezone.utc)  # Add timestamp for tracking
                        }
                        
                        try:
                            # Insert into ships collection
                            ships_collection.insert_one(ship_document)
                            print(f"[{datetime.now(timezone.utc)}] SAVED SHIP - ID: {ais_message['UserID']} Name: {ais_message.get('Name')} Destination: {ais_message.get('Destination')} Type: {ais_message.get('Type')}")
                        except Exception as e:
                            print(f"[{datetime.now(timezone.utc)}] ERROR saving ship data: {e}")
                        
                        known_ships.append(ais_message['UserID'])

            
            if message_type == 'PositionReport':
                ais_message = message['Message']['PositionReport']
                if ais_message['UserID'] in known_ships:
                    # Create position document matching your positionSchema.js structure
                    position_document = {
                        'MessageID': ais_message.get('MessageID'),
                        'RepeatIndicator': ais_message.get('RepeatIndicator'),
                        'UserID': ais_message.get('UserID'),
                        'Valid': ais_message.get('Valid'),
                        'NavigationalStatus': ais_message.get('NavigationalStatus'),
                        'RateOfTurn': ais_message.get('RateOfTurn'),
                        'Sog': ais_message.get('Sog'),
                        'PositionAccuracy': ais_message.get('PositionAccuracy'),
                        'Longitude': ais_message.get('Longitude'),
                        'Latitude': ais_message.get('Latitude'),
                        'Cog': ais_message.get('Cog'),
                        'TrueHeading': ais_message.get('TrueHeading'),
                        'Timestamp': ais_message.get('Timestamp'),
                        'SpecialManoeuvreIndicator': ais_message.get('SpecialManoeuvreIndicator'),
                        'Spare': ais_message.get('Spare'),
                        'Raim': ais_message.get('Raim'),
                        'CommunicationState': ais_message.get('CommunicationState'),
                        'received_timestamp': datetime.now(timezone.utc)  # Add timestamp for tracking
                    }
                    
                    try:
                        # Insert into positions collection
                        positions_collection.insert_one(position_document)
                        print(f"[{datetime.now(timezone.utc)}] SAVED POSITION - ShipID: {ais_message['UserID']} Lat: {ais_message.get('Latitude')} Lon: {ais_message.get('Longitude')} Heading: {ais_message.get('TrueHeading')}")
                    except Exception as e:
                        print(f"[{datetime.now(timezone.utc)}] ERROR saving position data: {e}")


            
            # ais_message = message['Message']
            # print(ais_message)
            

                
if __name__ == "__main__":
    asyncio.run(connect_ais_stream())