document.addEventListener('DOMContentLoaded', () => {
    // Constants
    const PLATE_WEIGHTS_LBS = [100, 45, 35, 25, 10, 5, 2.5, 1.25];
    const PLATE_WEIGHTS_KG = [25, 20, 15, 10, 5, 2.5, 2, 1.5, 1, 0.5];
    const KG_TO_LBS = 2.20462;
    const LBS_TO_KG = 0.453592;

    // DOM Elements
    const unitToggle = document.getElementById('unitToggle');
    const barbellWeight = document.getElementById('barbellWeight');
    const targetWeight = document.getElementById('targetWeight');
    const calculateBtn = document.getElementById('calculateBtn');
    const platesLeft = document.querySelector('.plates-left');
    const platesRight = document.querySelector('.plates-right');

    // State
    let isMetric = false;
    // Initialize with default plate counts
    let availablePlates = new Map([
        [100, 0],  // No 100lb plates by default
        [45, 6],   // 6x 45lb plates
        [35, 0],   // No 35lb plates by default
        [25, 2],   // 2x 25lb plates
        [10, 4],   // 4x 10lb plates
        [5, 2],    // 2x 5lb plates
        [2.5, 2],  // 2x 2.5lb plates
        [1.25, 2]  // 2x 1.25lb plates (closest to 1.5lb)
    ]);

    // Initialize plate counters
    initializePlateCounters();

    // Event Listeners
    unitToggle.addEventListener('change', toggleUnits);
    calculateBtn.addEventListener('click', calculatePlateCombination);

    function initializePlateCounters() {
        const plateOptions = document.querySelector('.plate-options');
        plateOptions.innerHTML = ''; // Clear existing options

        PLATE_WEIGHTS_LBS.forEach((weight) => {
            const plateOption = document.createElement('div');
            plateOption.className = 'plate-option';
            
            const weightSpan = document.createElement('span');
            weightSpan.textContent = `${weight} lbs`;
            
            const counter = document.createElement('div');
            counter.className = 'counter';
            
            const decrementBtn = document.createElement('button');
            decrementBtn.className = 'decrement';
            decrementBtn.textContent = '-';
            
            const countSpan = document.createElement('span');
            countSpan.className = 'count';
            countSpan.textContent = availablePlates.get(weight).toString();
            
            const incrementBtn = document.createElement('button');
            incrementBtn.className = 'increment';
            incrementBtn.textContent = '+';
            
            counter.appendChild(decrementBtn);
            counter.appendChild(countSpan);
            counter.appendChild(incrementBtn);
            
            plateOption.appendChild(weightSpan);
            plateOption.appendChild(counter);
            
            plateOptions.appendChild(plateOption);

            // Add event listeners
            incrementBtn.addEventListener('click', () => {
                const currentCount = availablePlates.get(weight) || 0;
                availablePlates.set(weight, currentCount + 1);
                countSpan.textContent = currentCount + 1;
            });

            decrementBtn.addEventListener('click', () => {
                const currentCount = availablePlates.get(weight) || 0;
                if (currentCount > 0) {
                    availablePlates.set(weight, currentCount - 1);
                    countSpan.textContent = currentCount - 1;
                }
            });
        });
    }

    function toggleUnits() {
        isMetric = unitToggle.checked;
        
        // Update target weight placeholder
        targetWeight.placeholder = isMetric ? "Enter target weight (kg)" : "Enter target weight (lbs)";
        
        // If there's a value in the target weight field, convert it
        const currentTarget = targetWeight.value;
        if (currentTarget !== '') {
            const numValue = parseFloat(currentTarget);
            if (!isNaN(numValue)) {
                targetWeight.value = isMetric ? 
                    (numValue * LBS_TO_KG).toFixed(1) : 
                    (numValue * KG_TO_LBS).toFixed(1);
            }
        }

        // Update barbell weight options
        const currentValue = barbellWeight.value;
        barbellWeight.innerHTML = '';
        const weights = [25, 30, 35, 40, 45, 50, 55, 60];
        weights.forEach(weight => {
            const option = document.createElement('option');
            option.value = weight; // Always store lbs value
            option.textContent = isMetric ? 
                `${(weight * LBS_TO_KG).toFixed(1)} kg` : 
                `${weight} lbs`;
            option.selected = weight === parseInt(currentValue);
            barbellWeight.appendChild(option);
        });

        // Reinitialize plate counters with new unit system
        initializePlateCounters();
    }

    function calculatePlateCombination() {
        const barbellWeightValue = parseFloat(barbellWeight.value);
        let targetWeightValue = parseFloat(targetWeight.value);
        
        if (isNaN(targetWeightValue)) {
            showError(`Please enter a valid target weight in ${isMetric ? 'kilograms' : 'pounds'}`);
            return;
        }

        // Convert target weight to lbs if in metric mode
        const targetWeightInLbs = isMetric ? targetWeightValue * KG_TO_LBS : targetWeightValue;
        const barbellWeightInLbs = barbellWeightValue; // Barbell weight is always stored in lbs

        const weightToAdd = targetWeightInLbs - barbellWeightInLbs;
        if (weightToAdd <= 0) {
            const barbellDisplay = isMetric ? 
                `${(barbellWeightInLbs * LBS_TO_KG).toFixed(1)} kg` : 
                `${barbellWeightInLbs} lbs`;
            showError(`Target weight must be greater than barbell weight (${barbellDisplay})`);
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

        // Get the appropriate plate weights based on the current unit system
        const plateWeights = isMetric ? 
            PLATE_WEIGHTS_KG.map(kg => kg * KG_TO_LBS) : 
            PLATE_WEIGHTS_LBS;

        // Sort plates in descending order
        const sortedPlates = [...plateWeights].sort((a, b) => b - a);

        // First pass: try to use the largest plates possible
        for (const plateWeight of sortedPlates) {
            const availableCount = availablePlates.get(plateWeight) || 0;
            if (availableCount === 0) continue;

            // Calculate maximum number of pairs we can use
            const maxPairs = Math.min(
                Math.floor(remainingWeight / plateWeight),
                Math.floor(availableCount / 2) // Ensure we have enough plates for both sides
            );

            if (maxPairs > 0) {
                combination.set(plateWeight, maxPairs * 2); // Store total plates needed (both sides)
                remainingWeight -= maxPairs * plateWeight;
                totalPlates += maxPairs * 2;
            }

            if (remainingWeight === 0) break;
        }

        // If we couldn't find an exact combination, try to find the closest possible
        if (remainingWeight > 0) {
            // Find the smallest plate that can help us get closer
            for (const plateWeight of sortedPlates) {
                const availableCount = availablePlates.get(plateWeight) || 0;
                if (availableCount === 0) continue;

                const maxPairs = Math.min(
                    Math.ceil(remainingWeight / plateWeight),
                    Math.floor(availableCount / 2)
                );

                if (maxPairs > 0) {
                    combination.set(plateWeight, maxPairs * 2);
                    remainingWeight -= maxPairs * plateWeight;
                    totalPlates += maxPairs * 2;
                    break;
                }
            }
        }

        return combination;
    }

    function displayPlateCombination(combination) {
        // Clear previous plates
        platesLeft.innerHTML = '';
        platesRight.innerHTML = '';

        // Convert Map to array and sort by weight (heaviest first)
        const sortedPlates = Array.from(combination.entries())
            .sort((a, b) => b[0] - a[0]); // Sort by weight in descending order

        // Create plates for both sides in sorted order
        for (const [weight, totalCount] of sortedPlates) {
            // Since we stored total count, divide by 2 to get count per side
            const countPerSide = totalCount / 2;
            for (let i = 0; i < countPerSide; i++) {
                const plate = createPlateElement(weight);
                platesLeft.appendChild(plate.cloneNode(true));
                platesRight.appendChild(plate);
            }
        }
    }

    function createPlateElement(weight) {
        const plate = document.createElement('div');
        plate.className = 'plate ' + getWeightClass(weight);
        plate.textContent = isMetric ? 
            `${(weight * LBS_TO_KG).toFixed(1)} kg` : 
            `${weight} lb`;
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
        // Create or get error message element
        let errorElement = document.getElementById('error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = 'error-message';
            errorElement.className = 'error-message';
            document.body.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        // Hide error after 3 seconds
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 3000);
    }

    // Add error message styling
    const style = document.createElement('style');
    style.textContent = `
        .error-message {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #ff4444;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            display: none;
        }
    `;
    document.head.appendChild(style);
}); 