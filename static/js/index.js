/**
 * Created by chris on 12/27/18.
 */

function getJson(json) {
    var parsed =  JSON.parse(json);
    var result = {};
    for (var i=0; i < parsed.length; i++) {
        var name = parsed[i].name.toLowerCase();
        result[name] = parsed[i];
    }
    return result;
}

var epsilon = .02;
var pokemonData, chargeData, fastData, typeData;
var call1 = $.ajax({url: "/pokemon", success: function(result){
    pokemonData = getJson(result);
}});
var call2 = $.ajax({url: "/fast", success: function(result){
    fastData = getJson(result);
}});
var call3 = $.ajax({url: "/charge", success: function(result){
    chargeData = getJson(result);
}});
var call4 = $.ajax({url: "/types", success: function(result){
    typeData = getJson(result);
}});

var strengthMod = 1.6;
var STAB = 1.2;
var weaknessMod = .625;
var immuneMod = weaknessMod * weaknessMod;
var pokemonForms = [];
var totalStrengths = $('#totalStrengths');
var totalWeaknesses = $('#totalWeaknesses');
var totalTDOVal = $('#totalTDO');
var maxTDO = 290;
var numPokemon = 3;

var maxCP = 1500;

var greatLeague = $('#great-league');
var ultraLeague = $('#ultra-league');
var masterLeague = $('#master-league');

function updateLeague(that){
    greatLeague.attr("style", "opacity: 1");
    ultraLeague.attr("style", "opacity: 1");
    masterLeague.attr("style", "opacity: 1");
    that.attr("style", "opacity: .5");
    for(var i in pokemonForms){
        pokemonForms[i].updatePokemon();
    }
}

greatLeague.on('click', function() {
    maxCP = 1500;
    maxTDO = 290;
    updateLeague($(this));

});

greatLeague.click();

ultraLeague.on('click', function() {
    maxCP = 2500;
    maxTDO = 625;
    updateLeague($(this));
});

masterLeague.on('click', function() {
    maxCP = 9999;
    maxTDO = 800;
    updateLeague($(this));
});

$.when(call1, call2, call3, call4).done(function() {

    for (var monNum = 0; monNum < numPokemon; monNum++){
        pokemonForms.push(new PokemonForm(monNum));
        updateOverallStats();
    }
});

function PokemonForm (monNum) {
    this.monNum = monNum;

    this.pokeInput = $('#pokemonInput' + monNum);
    this.chargeInput = $('#chargeInput' + monNum);
    this.charge2Input = $('#charge2Input' + monNum);
    this.fastInput = $('#fastInput' + monNum);

    this.fastTypeImg = $('#fastType' + monNum);
    this.chargeTypeImg = $('#chargeType' + monNum);
    this.charge2TypeImg = $('#charge2Type' + monNum);

    this.pokemonList = $('#pokemonList' + monNum);
    this.chargeList = $('#chargeList' + monNum);
    this.fastList = $('#fastList' + monNum);

    this.strengths = $('#strengths' + monNum);
    this.weaknesses = $('#weaknesses' + monNum);

    this.pokeImg = $('#poke-img' +  monNum);
    this.type1Img = $('#type1' + monNum);
    this.type2Img = $('#type2' + monNum);

    this.pokeRec = $('#pokeRec' + monNum);

    this.TDOVal = $('#TDO' + monNum);

    this.pokeRec.on('click', function () {
        recommendPokemon(monNum);
    });

    this.chargeInput.on('click', function () {
        $(this).val('');
    });

    this.charge2Input.on('click', function () {
        $(this).val('');
    });

    this.fastInput.on('click', function () {
        $(this).val('');
    });

    this.pokeInput.on('click', function () {
        $(this).val('');
    });

    this.chargeInput.on('input', $.proxy(this.updateStats, this));
    this.charge2Input.on('input', $.proxy(this.updateStats, this));
    this.fastInput.on('input', $.proxy(this.updateStats, this));

    this.pokeInput.change($.proxy(this.updatePokemon, this));
    var name = randomPokemon().name;
    this.pokeInput.val(name);
    this.updatePokemon();
}

function randomPokemon() {
    var keys = Object.keys(pokemonData);
    return pokemonData[keys[ keys.length * Math.random() << 0]];
}

PokemonForm.prototype.updateStats = function() {
    if (this.pokemon === undefined) {
        console.log("Undefined pokemon, not updating moveset.");
        return;
    }

    this.fastMoveName = this.fastInput.val();
    this.chargeMoveName = this.chargeInput.val();
    this.charge2MoveName = this.charge2Input.val();
    this.updateAttackImages();

    this.TDOStats = getTDOStats(this.pokemon, this.fastMoveName,
        this.chargeMoveName, this.charge2MoveName);

    setTDOVal(this.TDOVal, this.TDOStats["neutral"], maxTDO);


    this.updateTypeEffectiveness();
    updateOverallStats();
};

PokemonForm.prototype.updateAttackImages = function() {
    setSmallTypeImage(this.fastTypeImg, fastData[this.fastMoveName.toLowerCase()].type);
    setSmallTypeImage(this.chargeTypeImg, chargeData[this.chargeMoveName.toLowerCase()].type);
    setSmallTypeImage(this.charge2TypeImg, chargeData[this.charge2MoveName.toLowerCase()].type);
};

PokemonForm.prototype.updateTypeEffectiveness = function(){
    var TDO = this.TDOStats["neutral"];
    var strengths = [];
    var superStrengths = [];
    var weaknesses = [];
    var superWeaknesses = [];

    this.effectiveness = [];

    for(var type in this.TDOStats) {
        this.effectiveness.push({
           type: type,
           strength: this.TDOStats[type] / TDO
        });
    }
    addEffectivenessVisual(this.effectiveness, this.strengths, this.weaknesses);

};

function recommendPokemon(monNum) {
    var form = pokemonForms[monNum];
    for(var i in pokemonForms){
        pokemonForms[i].pokeRec.attr("disabled", "disabled");
        pokemonForms[i].pokeRec.addClass("disabled");
    }
    var topData = getTopTeammate(monNum);
    form.pokeInput.val(topData.name);
    form.updatePokemon();
    form.fastInput.val(topData.fast);
    form.chargeInput.val(topData.charge);
    form.charge2Input.val(topData.charge2);
    form.updateStats();
    for(var i in pokemonForms){
        pokemonForms[i].pokeRec.removeAttr("disabled");
    }

}

function getTopTeammate(monNum){
    var weaknesses = [];
    var strengths = [];

    var overallEffectiveness = {};
    for (var type in typeData) {
        overallEffectiveness[type]=0;
        for (var i = 0; i < pokemonForms.length; i++) {
            if(i !== monNum){
                var effectiveness = pokemonForms[i].effectiveness;
                for (var j = 0; j < effectiveness.length; j++)
                if (effectiveness[j].type.toLowerCase() === type) {
                    overallEffectiveness[type] += effectiveness[j].strength/(pokemonForms.length-1);
                }
            }
        }
    }
    // for (var type in overallEffectiveness){
    //     if (overallEffectiveness[type] < 1 - epsilon){
    //         weaknesses.push(type);
    //     }
    //     else if (overallEffectiveness[type] > strengthMod + epsilon){
    //         strengths.push(type);
    //     }
    // }
    var maxScore = -999999;
    var topPokemon;
    var currentPokemonName = pokemonForms[monNum].pokemon.name;

    for(var name in pokemonData){
        var topFast;
        var topCharge;
        var topCharge2;
        var pokemon = pokemonData[name];
        for(var j in pokemon.fast_moves){
            var fastMoveName = pokemon.fast_moves[j];
            for(var k in pokemon.charge_moves){
                var chargeMoveName = pokemon.charge_moves[k];
                for(var l in pokemon.charge_moves) {
                    var charge2MoveName = pokemon.charge_moves[l];
                    if (charge2MoveName !== chargeMoveName){
                        var stats = getTDOStats(pokemon, fastMoveName, chargeMoveName, charge2MoveName);
                        var weaknessScore = 0;
                        for(var type in stats){
                            var thisEffectiveness = stats[type] / stats["neutral"];
                            var effectiveness = (overallEffectiveness[type]*(numPokemon-1)+thisEffectiveness)/numPokemon;
                            if(effectiveness < 1) {
                                weaknessScore += Math.pow((1/effectiveness),2);
                            }
                        }
                        //console.log(name, weaknessScore);
                        var score = stats["neutral"] - weaknessScore*maxTDO*.1;

                        if (score > maxScore && pokemon.name !== currentPokemonName){
                            maxScore = score;
                            topPokemon = pokemon;
                            topFast = fastMoveName;
                            topCharge = chargeMoveName;
                            topCharge2 = charge2MoveName;
                        }
                    }
                }
            }
        }
    }
    return {
        "name": topPokemon.name,
        "fast": topFast,
        "charge": topCharge,
        "charge2": topCharge2
    };
}

function addEffectivenessVisual(effectiveness, strengths, weaknesses){
    strengths.find('img').remove();
    weaknesses.find('img').remove();
    effectiveness.sort(function(a,b){return b.strength - a.strength});
    for(var i=0; i < effectiveness.length; i++) {
        var effect = effectiveness[i];
        if(effect.strength > 1.5) {
            var size = Math.min(7*effect.strength, 32);
            var url = "static/images/types/"+effect.type+".png";
            var html = $("<img class='typeImage'></img>").attr("src", url).attr("width", size+"%").attr("height", size+"%");
            strengths.append(html);

        }
        else if (effect.strength < 1 - epsilon){
            var size = Math.min(7/effect.strength, 48);
            var url = "static/images/types/"+effect.type+".png";
            var html = $("<img class='typeImage'></img>").attr("src", url).attr("width", size+"%").attr("height", size+"%");
            weaknesses.prepend(html);
        }
    }
}

function updateOverallStats() {

    var overallEffectiveness = {};
    var overallEffectivenessList = [];
    for (var type in typeData) {
        overallEffectiveness[type]=0;
        for (var i = 0; i < pokemonForms.length; i++) {
            var effectiveness = pokemonForms[i].effectiveness;
            for (var j = 0; j < effectiveness.length; j++)
            if (effectiveness[j].type.toLowerCase() === type) {
                overallEffectiveness[type] += effectiveness[j].strength/pokemonForms.length;
            }
        }
        overallEffectivenessList.push({
            "type": type,
            "strength": overallEffectiveness[type]
        })
    }
    addEffectivenessVisual(overallEffectivenessList, totalStrengths, totalWeaknesses);

    var totalTDO = 0;
    for(var i = 0; i < pokemonForms.length; i++) {
        totalTDO += pokemonForms[i].TDOStats["neutral"]
    }
    setTDOVal(totalTDOVal, totalTDO, maxTDO*numPokemon);
    getTopCounters();
}

function setTDOVal(val, TDO, maxTDO){
    val.html(Math.round(TDO));
    var red = Math.min(255-255*Math.pow(TDO/maxTDO, 2), 255);
    var green = Math.min(255*Math.pow(TDO/maxTDO, 2), 255);
    val.attr("style","color:rgb("+red+","+green+",0)");
}


PokemonForm.prototype.updateMoves = function() {
    this.chargeList.find('option').remove();

    if (this.pokemon === undefined || this.pokemon.charge_moves.length < 1) {
        console.log("Error: Less than 1 charge move.");
        return;
    }

    for (var i in this.pokemon.charge_moves) {
        var chargeMove = this.pokemon.charge_moves[i];
        this.chargeList.append($("<option>")
            .val(chargeMove)
            .html(chargeMove)
        )
    }
    this.fastList.find('option').remove();

    if (this.pokemon === undefined || this.pokemon.fast_moves.length < 1) {
        console.log("Error: Less than 1 fast move.");
        return;
    }

    for (i in this.pokemon.fast_moves) {
        var fastMove = this.pokemon.fast_moves[i];
        this.fastList.append($("<option>")
            .val(fastMove)
            .html(fastMove)
        )
    }

    var topFast;
    var topCharge;
    var secondTopCharge;
    var topTDO = 0;
    for (i in this.pokemon.fast_moves) {
        var secondTopTDO = 0;
        var secondTopChargeForMove;
        for (var j in this.pokemon.charge_moves) {
            var TDOStats = getTDOStats(this.pokemon, this.pokemon.fast_moves[i],
                this.pokemon.charge_moves[j], this.pokemon.charge_moves[j]);
            var TDO = TDOStats["neutral"];
            if (TDO > topTDO) {
                topFast = this.pokemon.fast_moves[i];
                topCharge = this.pokemon.charge_moves[j];
                topTDO = TDO;
            }
            else if (TDO > secondTopTDO) {
                secondTopChargeForMove = this.pokemon.charge_moves[j];
                secondTopTDO = TDO;
            }
        }
        if (topFast === this.pokemon.fast_moves[i]) {
            secondTopCharge = secondTopChargeForMove;
        }
    }

    this.fastInput.val(topFast);
    this.chargeInput.val(topCharge);

    if (secondTopCharge === undefined){
        secondTopCharge = topCharge;
    }
    this.charge2Input.val(secondTopCharge);

};

PokemonForm.prototype.getPokemon = function() {
    var pokemonName = this.pokeInput.val();
    if (pokemonName === undefined) {
        console.log("undefined pokemon name");
        return undefined;
    }
    var pokemon = pokemonData[pokemonName.toLowerCase()];
    if (pokemon === undefined) {
        console.log("Error: Could not find pokemon" + pokemonName);
        return undefined;
    }
    return pokemon;
};

function setSmallTypeImage(htmlElement, type){
    var imageRoot = "static/images";
    var typeUrl = imageRoot + "/types/" + type + ".png";
    htmlElement.attr("src", typeUrl);
}

PokemonForm.prototype.updatePokemon = function() {
    this.pokemon = this.getPokemon();
    var imageRoot = "static/images";
    var pokeUrl = imageRoot + "/pokemon/icons/" + this.pokemon.number + ".png";

    this.pokeImg.attr("src", pokeUrl);

    setSmallTypeImage(this.type1Img, this.pokemon.types[0]);
    if (this.pokemon.types.length > 1){
        setSmallTypeImage(this.type2Img, this.pokemon.types[1]);
    }
    else {
        this.type2Img.attr("src","");
    }

    this.updateMoves();
    this.updateStats();
};

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


function adjustTDO(TDO, attackTypeName, defenseTypeName, attacking){
    var attackType = typeData[attackTypeName.toLowerCase()];
    defenseTypeName = capitalizeFirstLetter(defenseTypeName);
    if(attackType.immunes.includes(defenseTypeName)){
        if(attacking) TDO *= immuneMod;
        else TDO /= immuneMod;
    }
    if(attackType.weaknesses.includes(defenseTypeName)){
        if(attacking) TDO *= weaknessMod;
        else TDO /= weaknessMod;
    }
    if(attackType.strengths.includes(defenseTypeName)){
        if(attacking) TDO *= strengthMod;
        else TDO /= strengthMod;
    }
    return TDO;

}

function getAttackEffectiveness(){

    for(var i in pokemonForms) {
        var form = pokemonForms[i];
        form.attackingEffectiveness = {};
        var fastMove = getFastMove(form.fastMoveName);
        var chargeMove = getChargeMove(form.chargeMoveName);
        var charge2Move = getChargeMove(form.charge2MoveName);
        var TDOAttackStats = getAttackStats(form.pokemon, fastMove, chargeMove, charge2Move);
        for (var enemyType in typeData) {
            //Attacking
            var neutralTDO = TDOAttackStats.fastTDO + Math.max(TDOAttackStats.chargeTDO,
                    TDOAttackStats.charge2TDO);
            var fastTDO = adjustTDO(TDOAttackStats.fastTDO, fastMove.type, enemyType, true);
            var chargeTDO = adjustTDO(TDOAttackStats.chargeTDO, chargeMove.type, enemyType, true);
            var charge2TDO = adjustTDO(TDOAttackStats.charge2TDO, charge2Move.type, enemyType, true);
            var attackingTDO = fastTDO + Math.max(chargeTDO, charge2TDO);
            form.attackingEffectiveness[enemyType] = attackingTDO / neutralTDO;
        }
    }
}

function setTopCounters(pokemonTDOs) {
    var numCounters = 12;
    for(var i = 0; i < numCounters; i++){
        var pokemon = pokemonData[pokemonTDOs[i].name.toLowerCase()];
        $('#counter'+i).html(pokemon.name);
        var imageRoot = "static/images";
        var pokeUrl = imageRoot + "/pokemon/icons/" + pokemon.number + ".png";
        $('#counter-img'+i).attr("src", pokeUrl);
    }

}

function getTopCounters() {
    var topFast;
    var topCharge;
    var topCharge2;
    var topTDO = 0;
    var topTDOStats;
    var topPokemon;
    getAttackEffectiveness();
    var pokemonTDOs = [];

    for (var name in pokemonData) {
        var pokemon = pokemonData[name];
        var TDOStats = getTopDamageAgainstTeam(pokemon);
        //console.log(name, TDOStats.TDO);
        if (TDOStats.TDO > topTDO) {
            topTDO = TDOStats.TDO;
            topPokemon = pokemon;
            topTDOStats = TDOStats;
        }
        pokemonTDOs.push({
            name: pokemon.name,
            TDOStats: TDOStats
        })
    }
    //console.log(topPokemon);
    pokemonTDOs.sort(function(a,b) {return b.TDOStats.TDO - a.TDOStats.TDO});
    setTopCounters(pokemonTDOs);
}

function getTopDamageAgainstTeam(pokemon) {
    var topTDOStats = {
        TDO: 0
    };
    for (var i in pokemon.fast_moves) {
        var fastMove = getFastMove(pokemon.fast_moves[i]);
        for (var j in pokemon.charge_moves) {
            var chargeMove = getChargeMove(pokemon.charge_moves[j]);
            for (var k in pokemon.charge_moves) {
                var charge2Move = getChargeMove(pokemon.charge_moves[k]);
                var TDO = getTDOAgainstTeam(pokemon, fastMove, chargeMove, charge2Move);
                if (TDO > topTDOStats.TDO) {
                    topTDOStats = {
                        TDO: TDO,
                        fastMove: fastMove.name,
                        chargeMove: chargeMove.name,
                        charge2Move: charge2Move.name
                    }
                }
            }
        }
    }
    return topTDOStats;
}

function getTDOAgainstTeam(pokemon, fastMove, chargeMove, charge2Move){
    var TDOStats = getAttackStats(pokemon, fastMove, chargeMove, charge2Move);
    var totalTDO = 0;
    for(var i = 0; i < pokemonForms.length; i++) {
        var form = pokemonForms[i];
        var enemyPokemon = form.pokemon;
        for(var j in enemyPokemon.types){
            var enemyType = enemyPokemon.types[j];
            //Attacking
            var fastTDO = adjustTDO(TDOStats.fastTDO, fastMove.type, enemyType, true);
            var chargeTDO = adjustTDO(TDOStats.chargeTDO, chargeMove.type, enemyType, true);
            var charge2TDO = adjustTDO(TDOStats.chargeTDO, charge2Move.type, enemyType, true);
            var trueChargeTDO = Math.max(chargeTDO, charge2TDO);
        }
        var TDO = (fastTDO + trueChargeTDO);
        for (var j in pokemon.types) {
            var myType = pokemon.types[j];
            //Defending
            TDO /= form.attackingEffectiveness[myType.toLowerCase()];

        }
        totalTDO += TDO;
    }
    return totalTDO;
}

function getAttackStats(pokemon, fastMove, chargeMove, charge2Move) {
    var CP = maxCP;

    var attackIV = 0;
    var defenseIV = 15;
    var hpIV = 15;

    var statProduct = (pokemon.attack + attackIV) *
        Math.sqrt(pokemon.defense + defenseIV) * Math.sqrt(pokemon.hp + hpIV);
    var cpMult = Math.min(Math.sqrt(10 * CP / statProduct), 0.79030001);

    var attack = Math.round((pokemon.attack + attackIV) * cpMult);
    var defense = Math.round((pokemon.defense + defenseIV) * cpMult);
    var health = Math.round((pokemon.hp + hpIV) * cpMult);

    var fastDamage = fastMove.damage * attack / 100.0;
    var fastEpt = fastMove.energy / fastMove.turns;
    var chargeDamage = chargeMove.damage * attack / 100.0;
    var charge2Damage = charge2Move.damage * attack / 100.0;


    if (pokemon.types.includes(fastMove.type)) {
        fastDamage *= STAB;
    }
    if (pokemon.types.includes(chargeMove.type)) {
        chargeDamage *= STAB;
    }
    if (pokemon.types.includes(charge2Move.type)) {
        charge2Damage *= STAB;
    }

    var fastDpt = fastDamage / fastMove.turns;
    var chargeDpt = chargeDamage * (fastEpt / chargeMove.energy);
    var charge2Dpt = charge2Damage * (fastEpt / charge2Move.energy);


    var tankiness = health * defense;

    var TDOAttackStats = {
        fastTDO: tankiness * fastDpt/1000,
        chargeTDO: tankiness * chargeDpt / 1000,
        charge2TDO: tankiness * charge2Dpt / 1000
    };
    TDOAttackStats["TDO"] = TDOAttackStats.fastTDO + Math.max(TDOAttackStats.chargeTDO,
            TDOAttackStats.charge2TDO);
    return TDOAttackStats;
}

function getTDOStats(pokemon, fastMoveName, chargeMoveName, charge2MoveName) {
    var fastMove = getFastMove(fastMoveName);
    var chargeMove = getChargeMove(chargeMoveName);
    var charge2Move = getChargeMove(charge2MoveName);

    if (fastMove === undefined || chargeMove === undefined || charge2Move === undefined) {
        return 0;
    }
    var TDOAttackStats = getAttackStats(pokemon, fastMove, chargeMove, charge2Move);
    return getAdjustedTDOs(TDOAttackStats, pokemon, fastMove, chargeMove, charge2Move);
}

function getAdjustedTDOs(TDOAttackStats, pokemon, fastMove, chargeMove, charge2Move){
    var fastTDO = TDOAttackStats.fastTDO;
    var chargeTDO = TDOAttackStats.chargeTDO;
    var charge2TDO = TDOAttackStats.charge2TDO;
    var TDOs = {};
    //Defending
    var neutralTDO = fastTDO + Math.max(chargeTDO, charge2TDO);
    for (var enemyType in typeData) {
        var thisFastTDO = fastTDO;
        var thisChargeTDO = chargeTDO;
        var thisCharge2TDO = charge2TDO;
        //Attacking
        thisFastTDO = adjustTDO(thisFastTDO, fastMove.type, enemyType, true);
        thisChargeTDO = adjustTDO(thisChargeTDO, chargeMove.type, enemyType, true);
        thisCharge2TDO = adjustTDO(thisCharge2TDO, charge2Move.type, enemyType, true);
        var TDO = thisFastTDO + Math.max(thisChargeTDO, thisCharge2TDO);
        for (var i in pokemon.types) {
            var myType = pokemon.types[i];
            //Defending
            TDO = adjustTDO(TDO, enemyType, myType, false);
        }
        TDOs[enemyType] = TDO;
    }
    return TDOs;
}

function getChargeMove(name) {
    var chargeMove = chargeData[name.toLowerCase()];
    if (chargeMove === undefined) {
        console.log("Error: Charge move not found: " + chargeMove);
        return undefined;
    }
    return chargeMove;
}

function getFastMove(name) {
    var fastMove = fastData[name.toLowerCase()];
    if (fastMove === undefined) {
        console.log("Error: Fast move not found: " + fastMove);
        return undefined;
    }
    return fastMove;
}