class Type:

    def __init__(self, name, weak_to, resists, image):
        self.name = name
        self.weak_to = weak_to
        self.resists = resists
        self.image = image

    def to_json(self):
        return {
            "name": self.name,
            "weak_to": self.weak_to,
            "resists": self.resists,
            "image": self.image
        }