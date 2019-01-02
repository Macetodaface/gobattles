class FastMove:

    def __init__(self, name, type, damage, energy, turns, is_legacy=False):
        self.name = name
        self.type = type
        self.damage = damage
        self.energy = energy
        self.turns = turns
        self.is_legacy = is_legacy

    def to_json(self):
        return {
            "name": self.name,
            "type": self.type,
            "damage": self.damage,
            "energy": self.energy,
            "turns": self.turns,
            "is_legacy": self.is_legacy
        }
