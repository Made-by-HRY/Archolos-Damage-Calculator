let gLangJson = {};

window.addEventListener('DOMContentLoaded', async () => {
    initElements("melee");
    initElements("staff");
    initElements("ranged");

    let languageSelect = document.querySelector("#language");
    languageSelect.addEventListener("input", changeLanguage, true);

    let urlParams = new URLSearchParams(window.location.search);
    let hasLangParam = urlParams.has('lang');
    let allLangs = ["en", "pl"];
    let currentLang = "en";
    if (hasLangParam) {
        let paramLang = urlParams.get('lang');
        if (allLangs.includes(paramLang))
            currentLang = paramLang;
    }

    await fetch(`langs/${currentLang}.json`)
    .then(response => {
        return response.json();
    })
    .then(json => {
        gLangJson[currentLang] = { ...json };
    })
    .finally(() => {
        changeLanguage({target: {value: currentLang}});
        languageSelect.value = currentLang;
    });

    allLangs.splice(allLangs.indexOf(currentLang), 1);

    for (let lang of allLangs) {
        await fetch(`langs/${lang}.json`)
        .then(response => {
            return response.json();
        })
        .then(json => {
            gLangJson[lang] = { ...json };
        });
    }

});

const initElements = (idPrefix) => {
    let weaponInput = document.querySelector(`#${idPrefix}-weapon`);
    let attributeInput = document.querySelector(`#${idPrefix}-attribute`);
    let armorInput = document.querySelector(`#${idPrefix}-armor`);
    let penetrationInput = document.querySelector(`#${idPrefix}-penetration`);

    let inputElements = [weaponInput, attributeInput, armorInput, penetrationInput];

    inputElements.forEach(element => {
        if (element === null)
            return;

        let inputRange = document.getElementById(`${element.id}-range`);

        inputRange.addEventListener("input", calcDamage, true);
        element.addEventListener("input", calcDamage, true);

        if (element.dataset.min !== undefined)
            element.value = element.dataset.min;
        else
            element.value = element.min;

        inputRange.value = element.value;
    });

    calcDamage({srcElement: {id: weaponInput.id}});
}

const calcDamage = (event) => {
    let eventSrcId = event.srcElement.id;
    let idPrefix = eventSrcId.split("-")[0];
    let idSuffix = eventSrcId.split("-").pop();

    let weaponInput = document.querySelector(`#${idPrefix}-weapon`);
    let attributeInput = document.querySelector(`#${idPrefix}-attribute`);
    let armorInput = document.querySelector(`#${idPrefix}-armor`);
    let penetrationInput = document.querySelector(`#${idPrefix}-penetration`);
    let resultDiv = document.querySelector(`#${idPrefix}-result`);

    if (idSuffix === "range") {
        weaponInput.value = document.querySelector(`#${idPrefix}-weapon-range`).value;
        attributeInput.value = document.querySelector(`#${idPrefix}-attribute-range`).value;
        armorInput.value = document.querySelector(`#${idPrefix}-armor-range`).value;
        penetrationInput.value = document.querySelector(`#${idPrefix}-penetration-range`).value;
    } else {
        document.querySelector(`#${idPrefix}-weapon-range`).value = weaponInput.value;
        document.querySelector(`#${idPrefix}-attribute-range`).value = attributeInput.value;
        document.querySelector(`#${idPrefix}-armor-range`).value = armorInput.value;
        document.querySelector(`#${idPrefix}-penetration-range`).value = penetrationInput.value;
    }

    let weapon = getParsedValue(weaponInput);
    let attribute = getParsedValue(attributeInput);
    let armor = getParsedValue(armorInput);
    let penetration = getParsedValue(penetrationInput);

    let currentDamageType = weaponInput.id.split("-")[0];
    console.log(`Calculating minmax for '${currentDamageType}': `);
    console.log(`Weapon damage: ${weapon} Attribute: ${attribute} Enemy armor: ${armor} Armor penetration: ${penetration}`);

    let baseDamage = weapon + attribute;
    let armorRemainder = armor - penetration;
    let moreArmorThanPenetration = armorRemainder > 0;
    if (!moreArmorThanPenetration) armorRemainder = 0;

    let minDamage = Math.max(5, Math.floor((baseDamage - armorRemainder - 1) / 10));
    let maxDamage = Math.max(5, baseDamage - armorRemainder);

    if (currentDamageType === "ranged")
        minDamage = 0;

    resultDiv.innerHTML = `Min: ${minDamage}<br>Max: ${maxDamage}`;
}

const getParsedValue = (inputElement) => {
    let parsed = Number.parseInt(inputElement.value);

    if (Number.isNaN(parsed) || parsed < Number.parseInt(inputElement.min)) {
        inputElement.value = inputElement.min;
        parsed = Number.parseInt(inputElement.min);
    } else if (!Number.isNaN(Number.parseInt(inputElement.max)) && parsed > Number.parseInt(inputElement.max)) {
        inputElement.value = inputElement.max;
        parsed = Number.parseInt(inputElement.max);
    }

    return parsed;
}

const changeLanguage = (event) => {
    let lang = event.target.value;
    let currentJson = gLangJson[lang];

    for (let key in currentJson) {
        if (key === "page-title")
            continue;

        let elementId = `${key}-text`;

        try {
            document.getElementById(elementId).innerHTML = currentJson[key];
        } catch (e) {
            console.warn(`'changeLanguage' -> ${e.name}: ${e.message} for element id: ${elementId}`);
        }
    }

    window.history.replaceState(
        {additionalInformation: `changeLanguage -> ${lang}`},
        currentJson["page-title"],
        `?lang=${lang}`
    );
}