from database import Postgres

class Pokemon:

    def __init__(self, name, attack, defense, health, fast_moves, charge_moves, types, image):
        self.name = name
        self.attack = attack
        self.defense = defense
        self.health = health
        self.fast_moves = fast_moves
        self.charge_moves = charge_moves
        self.types = types
        self.image = image

    def to_json(self):
        return {
            "name": self.name,
            "attack": self.attack,
            "defense": self.defense,
            "health": self.health,
            "fast_moves": self.fast_moves,
            "charge_moves": self.charge_moves,
            "types": self.types,
            "image": self.image
        }

    def insert(self):
        Postgres.insert
