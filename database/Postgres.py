import json
import psycopg2
import logging
from models.Pokemon import Pokemon

# from psycopg2.extensions import register_adapter

class Postgres:

    def __init__(self, database, user, password, port, host):
        self.connection = psycopg2.connect(database=database, user=user, password=password, port=port, host=host)
        self.cursor = self.connection.cursor()
        #register_adapter(NlpEntity, NlpEntity.adapt_entity_group)


    def insert_group(self, group):
        try:
            self.cursor.execute("""
            INSERT INTO NlpEntityGroup values (%s, %s, %s, %s, %s, %s)
            """, (group.id, group.value, group.type, str(group.trusted_matches), str(group.nlp_ids), group.abstract,))
        except:
            self.cursor = self.connection.cursor()
        self.connection.commit()

    def insert_result(self, result):
        try:
            self.cursor.execute("""
            INSERT INTO NlpResult values (%s, %s, %s, %s, %s, %s)
            """, (result.id, str(result.nlpIds), result.isApproved, result.timestamp, result.value, result.type))
        except:
            self.cursor = self.connection.cursor()
        self.connection.commit()


    def result_to_pokemon(self, result):
        name = result[0]
        attack = result[1]
        defense = result[2]
        health = result[3]
        fast_moves = result[4]
        charge_moves = result[5]
        types = result[6]
        image = result[7]
        return Pokemon(name, attack, defense, health, fast_moves, charge_moves,
                       types, image)

    def get_all_pokemon(self):
        self.cursor.execute("SELECT * FROM Pokemon")
        results = self.cursor.fetchall()
        pokemon = list(map(self.result_to_pokemon, results))
        return pokemon

    def get_pokemon(self, name):
        self.cursor.execute("SELECT * FROM Pokemon where name='%s'" % name)
        result = self.cursor.fetchone()[0]
        pokemon = self.result_to_pokemon(result)
        return pokemon

    def get_connection(self):
        return self.connection

    def make_tables(self):
        self.cursor.execute("CREATE TABLE IF NOT EXISTS Pokemon (" +
                            "name VARCHAR PRIMARY KEY," +
                            "attack INT NOT NULL," +
                            "defense INT NOT NULL," +
                            "health INT NOT NULL, " +
                            "fast_moves VARCHAR[] NOT NULL," +
                            "charge_moves VARCHAR[] NOT NULL," +
                            "types VARCHAR[] NOT NULL," +
                            "image VARCHAR NOT NULL," +
                            ")")
        self.cursor.execute("CREATE TABLE IF NOT EXISTS FastMove (" +
                            "name VARCHAR PRIMARY KEY," +
                            "type VARCHAR NOT NULL," +
                            "damage INT NOT NULL," +
                            "energy INT NOT NULL," +
                            "turns INT NOT NULL," +
                            "is_legacy BOOL NOT NULL"
                            ")")
        self.cursor.execute("CREATE TABLE IF NOT EXISTS ChargeMove (" +
                            "name VARCHAR PRIMARY KEY," +
                            "type VARCHAR NOT NULL," +
                            "damage INT NOT NULL," +
                            "energy INT NOT NULL," +
                            "is_legacy BOOL NOT NULL"
                            ")")
        self.cursor.execute("CREATE TABLE IF NOT EXISTS Type (" +
                            "name VARCHAR PRIMARY KEY," +
                            "weak_to VARCHAR[] NOT NULL," +
                            "resists VARCHAR[] NOT NULL," +
                            "image VARCHAR NOT NULL" +
                            ")")
        self.connection.commit()
