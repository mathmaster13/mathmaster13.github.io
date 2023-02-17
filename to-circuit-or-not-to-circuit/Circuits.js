"use strict";
var ConeLocation;
(function (ConeLocation) {
    ConeLocation[ConeLocation["TERMINAL"] = 1] = "TERMINAL";
    ConeLocation[ConeLocation["GROUND"] = 2] = "GROUND";
    ConeLocation[ConeLocation["LOW"] = 3] = "LOW";
    ConeLocation[ConeLocation["MEDIUM"] = 4] = "MEDIUM";
    ConeLocation[ConeLocation["HIGH"] = 5] = "HIGH";
})(ConeLocation || (ConeLocation = {}));
const ALL_LOCATIONS = new Set([1, 2, 3, 4, 5]); // Object.values and friends make a set of 10 elements somehow? Because strings and ints? Maybe?
function possessionPoints(a) {
    return a == ConeLocation.TERMINAL ? 0 : 3;
}
const remotePatterns = [
    new Map([
        [ConeLocation.TERMINAL, 2],
        [ConeLocation.GROUND, 2],
        [ConeLocation.LOW, 3]
    ]),
    new Map([
        [ConeLocation.TERMINAL, 2],
        [ConeLocation.GROUND, 2],
        [ConeLocation.LOW, 4],
        [ConeLocation.HIGH, 1]
    ]),
    new Map([
        [ConeLocation.TERMINAL, 2],
        [ConeLocation.GROUND, 3],
        [ConeLocation.MEDIUM, 2]
    ]),
    new Map([
        [ConeLocation.TERMINAL, 2],
        [ConeLocation.GROUND, 2],
        [ConeLocation.MEDIUM, 2],
        [ConeLocation.HIGH, 1]
    ]),
    new Map([
        [ConeLocation.TERMINAL, 2],
        [ConeLocation.GROUND, 2],
        [ConeLocation.LOW, 3],
        [ConeLocation.HIGH, 1]
    ]),
    new Map([...ALL_LOCATIONS.values()].map(element => [element, remoteAmountOf(element)]))
];
class ImpossibleConstraintsException {
    constructor(constraints, msg) {
        this.constraints = constraints;
        this.msg = msg;
    }
}
class NotEnoughConesException {
    constructor(msg) {
        this.msg = msg;
    }
}
class ConePattern {
    constructor(map, amountOf = remoteAmountOf) {
        this.map = new Map(map);
        this.amountOf = amountOf;
    }
    get(key) {
        var _a;
        return (_a = this.map.get(key)) !== null && _a !== void 0 ? _a : 0;
    }
    possessions(cones, location) {
        return Math.min(cones, this.amountOf(location));
    }
    get score() {
        return [...this.map.entries()].reduce((acc, [element, count]) => {
            return acc + count * element + this.possessions(count, element) * possessionPoints(element);
        }, 0);
    }
    get cones() {
        return [...this.map.values()].reduce((acc, a) => acc + a, 0);
    }
    incrementValue(k) {
        this.map.set(k, this.get(k) + 1);
        return this;
    }
    addBestFrom(allowedLocations) {
        if (ConePattern.isTerminalOnly(allowedLocations)) {
            return this.incrementValue(ConeLocation.TERMINAL);
        }
        const set = ConePattern.validate(allowedLocations);
        const max = Math.max.apply(null, [...set]);
        while (set.size !== 0) {
            const element = Math.max.apply(null, [...set]);
            const count = this.get(element);
            if (count < this.amountOf(element)) {
                this.map.set(element, count + 1);
                return this;
            }
            set.delete(element);
        }
        return this.incrementValue(max);
    }
    toString() {
        let out = "";
        for (let [k, v] of this.map.entries()) {
            out += `${ConeLocation[k]}: ${v} cone${v == 1 ? "" : "s"}\n`;
        }
        return out;
    }
    static maxPointsForCones(cones, allowedLocations = ALL_LOCATIONS, locationAmounts = remoteAmountOf) {
        var _a, _b;
        if (ConePattern.isTerminalOnly(allowedLocations)) {
            return new ConePattern(new Map([[ConeLocation.TERMINAL, cones]]));
        }
        const set = ConePattern.validate(allowedLocations);
        const max = Math.max(...set);
        const map = new Map();
        let i = 0;
        while (i < cones) {
            if (set.size === 0) {
                map.set(max, ((_a = map.get(max)) !== null && _a !== void 0 ? _a : 0) + cones - i);
                break;
            }
            const element = Math.max(...set);
            const newCones = Math.min(locationAmounts(element), cones - i);
            map.set(element, ((_b = map.get(element)) !== null && _b !== void 0 ? _b : 0) + newCones);
            set.delete(element);
            i += newCones;
        }
        return new ConePattern(map, locationAmounts);
    }
    static isTerminalOnly(locations) {
        return locations.size === 1 && locations.has(ConeLocation.TERMINAL);
    }
    static validate(locations) {
        const set = new Set(locations);
        set.delete(ConeLocation.TERMINAL);
        if (set.size === 0)
            throw new ImpossibleConstraintsException(locations, "Cannot add a cone if no cones are allowed to be added!");
        return set;
    }
}
class RemoteCircuitPattern extends ConePattern {
    constructor(map) {
        let copy = new Map(map);
        super(map, location => { var _a; return (_a = copy.get(location)) !== null && _a !== void 0 ? _a : 0; });
    }
    addBestFrom(allowedLocations) {
        try {
            return super.addBestFrom(new Set([...allowedLocations].filter(elem => this.map.has(elem))));
        }
        catch (e) {
            if (e instanceof ImpossibleConstraintsException) {
                throw new ImpossibleConstraintsException(allowedLocations, "This circuit is impossible with constraints " + e.constraints);
            }
            else {
                throw e;
            }
        }
    }
    static maxPointsForCircuit(remotePatternIndex, cones, allowedLocations = ALL_LOCATIONS) {
        const pattern = getRemoteCircuitPattern(remotePatternIndex);
        // if (!allowedLocations.containsAll(pattern.keys))
        if (![...pattern.map.keys()].reduce((acc, current) => {
            return acc && allowedLocations.has(current);
        }, true))
            throw new ImpossibleConstraintsException(allowedLocations, "This circuit is impossible with the constraints you have set. Refer to Game Manual 2 for what each circuit requires.");
        const requiredCones = pattern.cones;
        if (requiredCones > cones)
            throw new NotEnoughConesException(`This circuit requires at least ${requiredCones} cones, so you are unable to score the circuit.`);
        while (pattern.cones < cones)
            pattern.addBestFrom(allowedLocations);
        return pattern;
    }
}
function remoteAmountOf(l) {
    switch (l) {
        case ConeLocation.TERMINAL: return 2;
        case ConeLocation.GROUND: return 6;
        case ConeLocation.LOW: return 6;
        case ConeLocation.MEDIUM: return 2;
        case ConeLocation.HIGH: return 1;
    }
}
function getRemoteCircuitPattern(i) {
    return new RemoteCircuitPattern(remotePatterns[i - 1]);
}
function noCircuitThreshold(remotePatternIndex, allowedLocations = ALL_LOCATIONS) {
    const circuit = getRemoteCircuitPattern(remotePatternIndex);
    let threshold = circuit.cones;
    const bestPattern = ConePattern.maxPointsForCones(threshold, allowedLocations);
    while (circuit.score + 20 > bestPattern.score && threshold <= 30) {
        circuit.addBestFrom(allowedLocations);
        bestPattern.addBestFrom(allowedLocations);
        threshold++;
    }
    return [threshold > 30 ? null : threshold, circuit.score + 20 === bestPattern.score];
}
function addLocationFrom(element, itemToAdd, dst) {
    if (document.getElementById(`${element}-checkbox`).checked)
        dst.add(itemToAdd);
    return dst;
}
// DOM time
const inGeneral = document.getElementById("in-general");
const circuitScore = document.getElementById("circuit-score");
const nonCircuitScore = document.getElementById("non-circuit-score");
const bestScore = document.getElementById("best-score");
const err = document.getElementById("err");
const cones = document.getElementById("cone-amount");
const patternIndex = document.getElementById("circuit-pattern");
const specificScoreDiv = document.getElementById("specific-scoring");
const generalScoreDiv = document.getElementById("general-scoring");
document.getElementById('submit').onclick = () => {
    // input validation
    const allowedLocations = new Set([ConeLocation.TERMINAL]);
    addLocationFrom("ground", ConeLocation.GROUND, allowedLocations);
    addLocationFrom("low", ConeLocation.LOW, allowedLocations);
    addLocationFrom("medium", ConeLocation.MEDIUM, allowedLocations);
    addLocationFrom("high", ConeLocation.HIGH, allowedLocations);
    const patternString = patternIndex.value;
    if (patternString === "")
        return error("No circuit pattern was supplied.");
    const patternIdx = Number(patternString);
    // specific information
    handleSpecificInfo(patternIdx, allowedLocations);
    // general information
    const [threshold, canBeEqual] = noCircuitThreshold(patternIdx, allowedLocations);
    inGeneral.innerText = `For this pattern and these constraints, scoring a circuit is ${threshold == null ? "always most effective." :
        `less effective if you can score at least ${threshold + (canBeEqual ? 1 : 0)} cones.`}${canBeEqual ?
        ` If you score exactly ${threshold} cones, the scores will be equal.` : ""}`;
};
function handleSpecificInfo(patternIdx, allowedLocations) {
    // input validation
    const coneAmount = cones.value;
    let errorOutput = null;
    if (coneAmount === "")
        errorOutput = ["No cone amount was supplied. Information about this pattern in general is still available.", false];
    else if (coneAmount == 0)
        errorOutput = ["Haha your robot sucks", false];
    // check if specific information is available
    let circuitPattern;
    try {
        circuitPattern = RemoteCircuitPattern.maxPointsForCircuit(patternIdx, Number(coneAmount), allowedLocations);
    }
    catch (e) {
        const badConstraints = e instanceof ImpossibleConstraintsException;
        if (errorOutput == null || badConstraints) {
            errorOutput = [e.msg, badConstraints];
        }
    }
    if (errorOutput != null)
        return error(...errorOutput);
    // display specific information
    error("", false, false); // everything is fine; this sets an anti-error
    // @ts-ignore // this is safe because we always return if there's an error
    const circuit = circuitPattern.score + 20;
    const nonCircuitPattern = ConePattern.maxPointsForCones(+coneAmount, allowedLocations);
    const nonCircuit = nonCircuitPattern.score;
    circuitScore.innerHTML = `<b>Max Circuit Score:</b> ${circuit.toString()}`;
    nonCircuitScore.innerHTML = `<b>Max Non-Circuit Score:</b> ${nonCircuit.toString()}`;
    // @ts-ignore
    bestScore.innerText = (nonCircuit > circuit ? nonCircuitPattern : circuitPattern).toString();
}
function error(msg, disableGeneral = true, disableSpecific = true) {
    err.innerText = msg;
    generalScoreDiv.style.display = disableGeneral ? "none" : "block";
    specificScoreDiv.style.display = disableSpecific ? "none" : "block";
}
//# sourceMappingURL=Circuits.js.map
