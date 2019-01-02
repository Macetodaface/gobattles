import json
import os
import requests

parse_fast = False
parse_charge = False
parse_mon = False
get_images = False

if parse_fast:
    fast = open("static/raw/fastMovesOld.txt", "r")
    fastOut = open("static/fastMoves.txt", "w")
    moves = []
    for move in fast:
        data = move.split(",")

        new_move = {
            "name": data[0],
            "type": data[1],
            "damage": int(data[2]),
            "energy": int(data[3]),
            "turns": int(data[4])/500
        }
        moves.append(new_move)
    fastOut.truncate(0)
    fastOut.write(json.dumps(moves,indent=4))

if parse_charge:
    charge = open("static/raw/chargeMovesOld.txt", "r")
    chargeOut = open("static/chargeMoves.txt", "w")
    moves = []

    for move in charge:
        data = move.split(",")

        new_move = {
            "name": data[0],
            "type": data[1],
            "damage": int(data[2]),
            "energy": int(data[3]),
        }
        moves.append(new_move)

    chargeOut.truncate(0)
    chargeOut.write(json.dumps(moves, indent=4))

if parse_mon:
    pokemon = open("static/raw/pokemonOld.txt", "r")
    pokemonOut = open("static/pokemon.txt", "w")
    parsed_mon = []

    for mon in pokemon:
        data = mon.split(",")

        skip = False
        for entry in data[4:7]:
            if entry == "":
                skip = True

        for entry in data:
            if entry == "#N/A":
                skip = True

        if skip:
            print("Skipping pokemon " + data[1])

        else:
            new_mon = {
                "number": data[0],
                "name": data[1].replace("'",""),
                "attack": int(data[4]),
                "defense": int(data[5]),
                "hp": int(data[6]),
                "legacy_fast_moves": [],
                "legacy_charge_moves":[],
                "is_available": True
            }
            types = []
            for i in range(2, 4):
                if data[i] != "":
                  types.append(data[i])
            fast_moves = []
            charge_moves =[]
            for i in range(7, 21):
                if data[i] != "" and data[i] != "\n":
                    fast_moves.append(data[i].replace("\n",""))

            for i in range(23, 48):
                if data[i] != "" and data[i] != "\n":
                    charge_moves.append(data[i].replace("\n",""))

            new_mon["types"] = types
            new_mon["fast_moves"] = fast_moves
            new_mon["charge_moves"] = charge_moves
            parsed_mon.append(new_mon)

    pokemonOut.truncate(0)
    pokemonOut.write(json.dumps(parsed_mon,indent=4))

# if get_images:
#     pokemon = open("static/raw/pokemonOld.txt", "r")
#     parsed_mon = []

    # for mon in pokemon:
    #     data = mon.split(",")
    #     number = data[0]
    #
    #     number = str(data[0]).rjust(3,"0")
    #     name = data[1]
    #
    #     url = "https://archives.bulbagarden.net/media/upload/4/41/"+number+name+".png"
    #
    #     try:
    #         img_data = requests.get(url).content
    #         with open("static/images/" + name + ".png", "wb+") as handler:
    #             handler.truncate(0)
    #             handler.write(img_data)
    #     except:
    #         print('Failed to get image for pokemon ' + name)
