(function($) {

class Results {
    constructor() {
        this.rooms = 0;
        this.squareFeet = 0;
        this.cubicFeet = 0;
        this.gasPackets = 0;
        this.batchesRequired = 0;
        this.gallonsToPrepare = 0;
        this.gallonsRequired = 0;
        this.liquidPackets = 0;
    }
}

class JobCategory {
    constructor(name) { this.name = name; }
}

class JobGrade {
    constructor(name, squareFeetPerGallon, gallonsPerBatch, packetsPerBatch, cubicFeetPerPacket, hoursToAirOut) {
        this.name = name;
        this.squareFeetPerGallon = squareFeetPerGallon;
        this.gallonsPerBatch = gallonsPerBatch;
        this.packetsPerBatch = packetsPerBatch;
        this.cubicFeetPerPacket = cubicFeetPerPacket;
        this.hoursToAirOut = hoursToAirOut;
    }

    gallonsNeededForArea(area) {
        const extra = area % this.squareFeetPerGallon;
        return Math.floor(area / this.squareFeetPerGallon) + (extra > 0 ? 1 : 0);
    }

    batchesNeededForGallons(gallons) {
        const extra = gallons % this.gallonsPerBatch;
        let batches = Math.floor(gallons / this.gallonsPerBatch);
        if (extra > 0) batches++;
        return batches || 1;
    }

    gallonsForPreparation(batches) {
        return (batches || 1) * this.gallonsPerBatch;
    }

    packetsForPreparation(batches) {
        return (batches || 1) * this.packetsPerBatch;
    }

    gasPacketsNeeded(volume) {
        const extra = volume % this.cubicFeetPerPacket;
        return Math.floor(volume / this.cubicFeetPerPacket) + (extra > 0 ? 1 : 0);
    }
}

class JobType {
    constructor(name, category, grade) {
        this.name = name;
        this.category = category;
        this.grade = grade;
    }
}

class Room {
    constructor(node) {
        this.node = node;
        this.name = node.find(".name").text();
        this.include = node.find(".include").prop('checked');

        this.length = parseFloat(node.find(".lengthInput").val()) || 0;
        this.width  = parseFloat(node.find(".widthInput").val()) || 0;
        this.height = parseFloat(node.find(".heightInput").val()) || 0;

        this.area = this.length * this.width;
        this.volume = this.area * this.height;
    }

    getResults(jobType) {
        const results = new Results();
        results.rooms = 1;
        results.squareFeet = this.area;
        results.cubicFeet = this.volume;
        if (jobType) {
            results.gallonsRequired = jobType.grade.gallonsNeededForArea(this.area);
            results.gasPackets = jobType.grade.gasPacketsNeeded(this.volume);
        }
        return results;
    }

    displayResults(results) {
        this.node.find(".squareFeet").text(results.squareFeet);
        this.node.find(".cubicFeet").text(results.cubicFeet);
        this.node.find(".odorPacketsToUse").text(results.gasPackets);
    }
}

class Job {
    constructor(calculatorNode, jobTypesByName) {
        this.node = calculatorNode;
        this.jobType = jobTypesByName[calculatorNode.find("#jobTypes").val()];
        this.rooms = [];
        this.extraGallons = 0;

        const self = this;
        calculatorNode.find(".room").each((_, el) => {
            self.rooms.push(new Room($(el)));
        });

        this.results = new Results();
        this.calculate();
    }

    calculate() {
        const self = this;

        this.rooms.forEach(room => {
            if (room.include) {
                const r = room.getResults(self.jobType);
                this.results.rooms += r.rooms;
                this.results.squareFeet += r.squareFeet;
                this.results.cubicFeet += r.cubicFeet;
                this.results.gasPackets += r.gasPackets;
                room.displayResults(r);
            }
        });

        if (this.jobType) {
            const grade = this.jobType.grade;
            this.results.gallonsRequired = grade.gallonsNeededForArea(this.results.squareFeet);
            this.results.batchesRequired = grade.batchesNeededForGallons(this.results.gallonsRequired);
            this.results.gallonsToPrepare = grade.gallonsForPreparation(this.results.batchesRequired);
            this.results.liquidPackets = grade.packetsForPreparation(this.results.batchesRequired);
            this.extraGallons = this.results.gallonsToPrepare - this.results.gallonsRequired;
        }

        this.node.find("#roomCount #answer").text(this.results.rooms);
        this.node.find("#sizes #squareFeet #answer").text(this.results.squareFeet);
        this.node.find("#sizes #cubicFeet #answer").text(this.results.cubicFeet);
        this.node.find("#calculations #gallonsRequired #answer").text(this.results.gallonsRequired);
        this.node.find("#calculations #gallonsToPrepare #answer").text(this.results.gallonsToPrepare);
        this.node.find("#calculations #liquidPacketsToUse #answer").text(this.results.liquidPackets);
        this.node.find("#calculations #gasPacketsToUse #answer").text(this.results.gasPackets);
    }
}

class JobCalculator {
    constructor(container) {
        this.container = container;
        this.jobCategoryOdor = new JobCategory("Odor");
        this.standardGrade = new JobGrade("Standard Strength", 250, 5, 1, 1000, 1);

        this.jobTypes = [
            new JobType("Deodorization", this.jobCategoryOdor, this.standardGrade)
        ];
        this.jobTypesByName = {};
        this.jobTypes.forEach(jt => this.jobTypesByName[jt.name] = jt);

        this.init();
    }

    init() {
        const self = this;
        const calc = this.container;

        // Populate Job Types dropdown
        const select = calc.find("#jobTypes");
        select.empty().append(new Option("Select", ""));
        this.jobTypes.forEach(jt => select.append(new Option(jt.name, jt.name)));

        // Initial Room
        this.addRoom();

        // Event handlers
        select.on("change", () => this.updateCalculator());
        calc.on("change keyup mousedown", ".include, .input", () => this.updateCalculator());
        $("#addNewRoomContainer").on("click", () => { this.addRoom(); this.updateCalculator(); });
        $("#getInstructions").on("click", () => this.showInstructions());
        $("#recalculateButton").on("click", () => this.updateCalculator(true));
    }

    addRoom() {
        const roomCount = this.container.find(".room").length + 1;
        const roomDiv = $(`
            <div class="room" id="room${roomCount}">
                <div><span class="name">Room No. ${roomCount}</span> <input type="checkbox" class="include" checked></div>
                <div><p>Length</p><input type="number" step="1" min="1" value="1" class="lengthInput input"></div>
                <div><p>Width</p><input type="number" step="1" min="1" value="1" class="widthInput input"></div>
                <div class="odorStuff"><p>Height</p><input type="number" step="1" min="1" value="1" class="heightInput input"></div>
                <div class="results">
                    <div>Square Feet: <span class="squareFeet">0</span></div>
                    <div class="odorStuff">Cubic Feet: <span class="cubicFeet">0</span></div>
                    <div class="odorStuff">Gas Packets: <span class="odorPacketsToUse">0</span></div>
                </div>
            </div>
        `);
        this.container.find("#roomList").append(roomDiv);
    }

    updateCalculator(showAlert=false) {
        const job = new Job(this.container, this.jobTypesByName);
        if(showAlert) {
            alert(`Extra Gallons: ${job.extraGallons}`);
        }
    }

    showInstructions() {
        const job = new Job(this.container, this.jobTypesByName);
        const message = `Instructions for ${job.jobType.name} job.\nRooms: ${job.results.rooms}\nGallons: ${job.results.gallonsToPrepare}`;
        $("#instructions").html(`<textarea style="width:100%;height:300px;">${message}</textarea>`);
        $("#myModal").show();
    }
}

// Initialize all calculators on page load
$(function() {
    $(".job-calculator").each(function() {
        new JobCalculator($(this));
    });

    // Modal close
    $(".close").on("click", () => $("#myModal").hide());
    $(window).on("click", e => { if($(e.target).is("#myModal")) $("#myModal").hide(); });
});

})(jQuery);
