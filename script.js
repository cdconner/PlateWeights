document.addEventListener('DOMContentLoaded', () => {
    // Constants
    const PLATE_WEIGHTS = [100, 45, 35, 25, 10, 5, 2.5, 1.25];
    const KG_TO_LBS = 2.20462;
    const LBS_TO_KG = 0.453592;

    // DOM Elements
    const unitToggle = document.getElementById('unitToggle');
    const barbellWeight = document.getElementById('barbellWeight');
    const targetWeight = document.getElementById('targetWeight');
    const calculateBtn = document.getElementById('calculateBtn');
    const result = document.getElementById('result');
    const plateCombination = document.getElementById('plateCombination');
    const closeResult = document.getElementById('closeResult');
    const platesLeft = document.querySelector('.plates-left');
    const platesRight = document.querySelector('.plates-right');

    // State
    let isMetric = false;
    let availablePlates = new Map(PLATE_WEIGHTS.map(weight => [weight, 0]));

    // Initialize plate counters
    initializePlateCounters();

    // Event Listeners
    unitToggle.addEventListener('click', toggleUnits);
    calculateBtn.addEventListener('click', calculatePlateCombination);
    closeResult.addEventListener('click', () => result.classList.add('hidden'));

    function initializePlateCounters() {
        document.querySelectorAll('.plate-option').forEach((option, index) => {
            const weight = PLATE_WEIGHTS[index];
            const countSpan = option.querySelector('.count');
            const incrementBtn = option.querySelector('.increment');
            const decrementBtn = option.querySelector('.decrement');

            incrementBtn.addEventListener('click', () => {
                availablePlates.set(weight, availablePlates.get(weight) + 1);
                countSpan.textContent = availablePlates.get(weight);
            });

            decrementBtn.addEventListener('click', () => {
                const currentCount = availablePlates.get(weight);
                if (currentCount > 0) {
                    availablePlates.set(weight, currentCount - 1);
                    countSpan.textContent = currentCount - 1;
                }
            });
        });
    }

    function toggleUnits() {
        isMetric = !isMetric;
        unitToggle.textContent = isMetric ? 'Switch to lbs' : 'Switch to kg';
        
        // Update barbell weight options
        const currentValue = barbellWeight.value;
        barbellWeight.innerHTML = '';
        const weights = [25, 30, 35, 40, 45, 50, 55, 60];
        weights.forEach(weight => {
            const option = document.createElement('option');
            option.value = weight;
            option.textContent = isMetric ? 
                `${Math.round(weight * LBS_TO_KG)} kg` : 
                `${weight} lbs`;
            option.selected = weight === parseInt(currentValue);
            barbellWeight.appendChild(option);
        });

        // Update plate labels
        document.querySelectorAll('.plate-option span').forEach((span, index) => {
            const weight = PLATE_WEIGHTS[index];
            span.textContent = isMetric ? 
                `${Math.round(weight * LBS_TO_KG)} kg` : 
                `${weight} lbs`;
        });
    }

    function calculatePlateCombination() {
        const barbellWeightValue = parseFloat(barbellWeight.value);
        const targetWeightValue = parseFloat(targetWeight.value);

        if (isNaN(targetWeightValue)) {
            showError('Please enter a valid target weight');
            return;
        }

        const targetWeightInLbs = isMetric ? targetWeightValue * KG_TO_LBS : targetWeightValue;
        const barbellWeightInLbs = isMetric ? barbellWeightValue * KG_TO_LBS : barbellWeightValue;

        const weightToAdd = targetWeightInLbs - barbellWeightInLbs;
        if (weightToAdd <= 0) {
            showError('Target weight must be greater than barbell weight');
            return;
        }

        const plateCombination = findPlateCombination(weightToAdd / 2); // Divide by 2 for each side
        if (!plateCombination) {
            showError('Cannot achieve target weight with available plates. Please add more plates.');
            return;
        }

        displayPlateCombination(plateCombination);
    }

    function findPlateCombination(targetWeightPerSide) {
        const combination = new Map();
        let remainingWeight = targetWeightPerSide;
        let totalPlates = 0;

        // Sort plates in descending order
        const sortedPlates = [...PLATE_WEIGHTS].sort((a, b) => b - a);

        for (const plateWeight of sortedPlates) {
            const availableCount = availablePlates.get(plateWeight);
            if (availableCount === 0) continue;

            const maxPlates = Math.min(
                Math.floor(remainingWeight / plateWeight),
                availableCount
            );

            if (maxPlates > 0) {
                combination.set(plateWeight, maxPlates);
                remainingWeight -= maxPlates * plateWeight;
                totalPlates += maxPlates;
            }

            if (remainingWeight === 0) break;
        }

        return remainingWeight === 0 ? combination : null;
    }

    function displayPlateCombination(combination) {
        // Clear previous plates
        platesLeft.innerHTML = '';
        platesRight.innerHTML = '';

        // Create plates for both sides
        for (const [weight, count] of combination) {
            for (let i = 0; i < count; i++) {
                const plate = createPlateElement(weight);
                platesLeft.appendChild(plate.cloneNode(true));
                platesRight.appendChild(plate);
            }
        }

        // Show result modal
        result.classList.remove('hidden');
    }

    function createPlateElement(weight) {
        const plate = document.createElement('div');
        plate.className = 'plate ' + getWeightClass(weight);
        plate.textContent = isMetric ? 
            Math.round(weight * LBS_TO_KG) : 
            weight;
        return plate;
    }

    function getWeightClass(weightLbs) {
        // Round to 1 decimal place to handle floating point comparison
        const roundedWeight = Math.round(weightLbs * 10) / 10;

        // Match the pound values from the chart
        switch (roundedWeight) {
            case 55.1:
            case 55.12: return 'weight-25';  // 25kg = 55.12 lbs
            case 44.1:
            case 44.09: return 'weight-20';  // 20kg = 44.09 lbs
            case 33.1:
            case 33.07: return 'weight-15';  // 15kg = 33.07 lbs
            case 22.0:
            case 22.05: return 'weight-10';  // 10kg = 22.05 lbs
            case 11.0:
            case 11.02: return 'weight-5';   // 5kg = 11.02 lbs
            case 5.5:
            case 5.51: return 'weight-2-5';  // 2.5kg = 5.51 lbs
            case 4.4:
            case 4.41: return 'weight-2';    // 2kg = 4.41 lbs
            case 3.3:
            case 3.31: return 'weight-1-5';  // 1.5kg = 3.31 lbs
            case 2.2:
            case 2.20: return 'weight-1';    // 1kg = 2.20 lbs
            case 1.1:
            case 1.10: return 'weight-0-5';  // 0.5kg = 1.10 lbs
            // Common pound plates that don't match kg conversions
            case 45: return 'weight-20';     // Treat 45lb as blue (closest to 20kg)
            case 35: return 'weight-15';     // Treat 35lb as yellow (closest to 15kg)
            case 25: return 'weight-10';     // Treat 25lb as green (closest to 10kg)
            case 10: return 'weight-5';      // Treat 10lb as white (closest to 5kg)
            case 5: return 'weight-2-5';     // Treat 5lb as red (closest to 2.5kg)
            case 2.5: return 'weight-1';     // Treat 2.5lb as green (closest to 1kg)
            case 1.25: return 'weight-0-5';  // Treat 1.25lb as white (closest to 0.5kg)
            default: return 'weight-other';
        }
    }

    function showError(message) {
        plateCombination.innerHTML = `<p class="error">${message}</p>`;
        result.classList.remove('hidden');
    }
}); 