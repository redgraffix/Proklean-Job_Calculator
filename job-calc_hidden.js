jQuery(document).ready(function($){

    let extraGallons;

    const CalcController = function() {

        function Job(calculatorNode){
            this.node = calculatorNode;
            this.jobType = jobTypesByName[calculatorNode.find("#jobTypes").val()];

            this.rooms = [];
            var self = this;
            $.each(calculatorNode.find(".room"), function(index, node){
                self.rooms[index] = new Room(node);
            });

            var results = new Results();
            $.each(this.rooms, function(index, room){
                if(room.include){
                    var roomResults = room.getResults(self.jobType);

                    results.rooms += roomResults.rooms;
                    results.squareFeet += roomResults.squareFeet;
                    results.cubicFeet += roomResults.cubicFeet;
                    results.gasPackets += roomResults.gasPackets;

                    room.displayResults(roomResults);
                }
            });

            if(self.jobType !== undefined){
                results.gallonsRequired = self.jobType.jobGrade.calculateGallonsNeededForSprayByArea(results.squareFeet);
                results.batchesRequired = self.jobType.jobGrade.calculateNumberOfBatchesNeededForGallonsRequired(results.gallonsRequired);
                results.gallonsToPrepare = self.jobType.jobGrade.calculateNumberOfGallonsNeededForSoutionPreparation(results.batchesRequired);
                results.liquidPackets = self.jobType.jobGrade.calculateNumberOfPacketsNeededForSolutionPreparation(results.batchesRequired);
                extraGallons = results.gallonsToPrepare - results.gallonsRequired;
            }

            this.results = results;

            this.node.find("#roomCount #answer").text(results.rooms);
            this.node.find("#sizes #squareFeet #answer").text(results.squareFeet);
            this.node.find("#calculations #gallonsRequired #answer").text(results.gallonsRequired);
            this.node.find("#calculations #gallonsToPrepare #answer").text(results.gallonsToPrepare);
            this.node.find("#calculations #liquidPacketsToUse #answer").text(results.liquidPackets);
            this.node.find("#sizes #cubicFeet #answer").text(results.cubicFeet);
            this.node.find("#calculations #gasPacketsToUse #answer").text(results.gasPackets);
        }

        function Room(roomNode){
            this.node = $(roomNode);
            this.name = this.node.find(".name").text();
            this.results = new Results();

            var self = this;
            $.each(["length", "width", "height"], function(index, property){
                self[property] = parseFloat(self.node.find("."+ property +"Input").val());
                if(isNaN(self[property])) self[property] = 0;
            });

            this.include = this.node.find(".include").prop('checked');
            this.area = this.width * this.length;
            this.volume = this.area * this.height;

            this.getResults = function(jobType){
                var results = new Results();
                results.rooms = 1;
                results.squareFeet = this.area;
                results.cubicFeet = this.volume;

                if(jobType !== undefined){
                    results.gasPackets = jobType.jobGrade.calculateNumberOfGasPacketsNeeded(this.volume);
                    results.gallonsRequired = jobType.jobGrade.calculateGallonsNeededForSprayByArea(this.area);
                }

                return results;
            }

            this.displayResults = function(results){
                this.node.find(".squareFeet").text(results.squareFeet);
                this.node.find(".cubicFeet").text(results.cubicFeet);
                this.node.find(".odorPacketsToUse").text(results.gasPackets);
            }
        }

        function Results(){
            this.rooms = 0;
            this.squareFeet = 0;
            this.cubicFeet = 0;
            this.gasPackets = 0;
            this.batchesRequired = 0;
            this.gallonsToPrepare = 0;
            this.gallonsRequired = 0;
            this.liquidPackets = 0;
        }

        // JobCategory, JobGrade, JobType
        function JobCategory(name) { this.name = name; }
        const pathogenJobCategory = new JobCategory("Pathogen");
        const odorJobCategory = new JobCategory("Odor");

        function JobGrade(name, squareFeetPerGallon, gallonsPerBatch, packetsPerBatch, cubicFeetPerPacket, hoursToAirOut){
            this.name = name;
            this.squareFeetPerGallon = squareFeetPerGallon;
            this.gallonsPerBatch = gallonsPerBatch;
            this.packetsPerBatch = packetsPerBatch;
            this.cubicFeetPerPacket = cubicFeetPerPacket;
            this.hoursToAirOut = hoursToAirOut;

            this.calculateGallonsNeededForSprayByArea = function(area){
                var extraArea = area % this.squareFeetPerGallon;
                var gallons = Math.floor((area - extraArea) / this.squareFeetPerGallon);
                if(extraArea > 0) gallons++;
                return gallons;
            }
            this.calculateNumberOfBatchesNeededForGallonsRequired = function(gallons){
                var extraGallons = gallons % this.gallonsPerBatch;
                var batches = Math.floor((gallons - extraGallons) / this.gallonsPerBatch);
                if(extraGallons > 0) batches++;
                return (batches == 0 ? 1 : batches);
            }
            this.calculateNumberOfPacketsNeededForSolutionPreparation = function(batches){
                return (batches > 0 ? batches : 1) * this.packetsPerBatch;
            }
            this.calculateNumberOfGallonsNeededForSoutionPreparation = function(batches){
                return (batches > 0 ? batches : 1) * this.gallonsPerBatch;
            }
            this.calculateNumberOfGasPacketsNeeded = function(volume){
                var extraFeet = volume % this.cubicFeetPerPacket;
                var packets = Math.floor(volume / this.cubicFeetPerPacket);
                if(extraFeet > 0) packets++;
                return packets;
            }
        }

        const standardStrength = new JobGrade("Standard Strength", 250, 5, 1, 1000, 1);
        const extraStrength = new JobGrade("Extra Strength", 100, 5, 2, 1000, 3);

        function JobType(name, jobCategory, jobGrade){
            this.name = name;
            this.jobCategory = jobCategory;
            this.jobGrade = jobGrade;
        }
        const jobTypes = [
            new JobType("Deodorization", odorJobCategory, standardStrength),
            new JobType("Disinfection", pathogenJobCategory, standardStrength)
        ].sort((a,b) => a.name.localeCompare(b.name));

        const jobTypesByName = {};
        $.each(jobTypes, function() { jobTypesByName[this.name] = this; });

        // Populate jobTypes dropdown
        const $jobTypesDropdown = $("#jobTypes");
        $jobTypesDropdown.empty().append("<option value=''>Select Job Type</option>");
        $.each(jobTypes, function(i, jt){
            $jobTypesDropdown.append(`<option value='${jt.name}'>${jt.name}</option>`);
        });

        // DOM helpers
        const createRoom = function() {
            var currentRoomNumber = $(".room").length + 1;
            var room = $("<div />").addClass("room").attr("id", "room"+currentRoomNumber);
            room.append($("<div><span class='name'>Room No. " + currentRoomNumber + "</span><input type='checkbox' checked class='include'></div>"));
            room.append($("<div><p>Length</p><input type='number' class='input lengthInput' value='1'></div>"));
            room.append($("<div><p>Width</p><input type='number' class='input widthInput' value='1'></div>"));
            room.append($("<div class='odorStuff'><p>Height</p><input type='number' class='input heightInput' value='1'></div>"));
            var results = $("<div />").addClass("results");
            results.append($("<div>Square Feet:<strong><span class='squareFeet'>0</span></strong></div>"));
            results.append($("<div class='odorStuff'>Cubic Feet:<strong><span class='cubicFeet'>0</span></strong></div>"));
            results.append($("<div class='odorStuff'>Gas Packets:<strong><span class='odorPacketsToUse'>0</span></strong></div>"));
            room.append(results);
            $("#roomList").append(room);
        };

        const recalcAndReset = function(){
            const job = new Job($("#calculator"));
            $("#calculations").show();
            $("#recalculateButton").hide();

            if(job.jobType && job.jobType.jobCategory.name == "Odor"){
                $(".odorStuff").show();
                $('#cubicFeet').show();
                $('#disinfection-labels').hide();
                $('#deodorization-labels').show();
            } else {
                $(".odorStuff").hide();
                $('#cubicFeet').hide();
                $('#disinfection-labels').show();
                $('#deodorization-labels').hide();
            }
        };

        // initial setup
        createRoom();
        recalcAndReset();

        // Event bindings
        $(document).on('change', "#jobTypes", recalcAndReset);
        $(document).on('change keyup mousedown', ".input, .include", recalcAndReset);
        $("#addNewRoomContainer").click(function(){
            createRoom();
            recalcAndReset();
        });

        // Get Instructions button
        $("#jobTypes").change(function(){
            $("#getInstructions").toggleClass("activate", $(this).val() !== "");
        });

        function createEmailForJob(job){
            var message = "You are about to work on a "+ job.jobType.name +" job type. Please read and follow these directions to correctly prepare and apply Proklean. See EPA Labels for full directions and precautions.\n\n";
            message += "This is what you will need to finish this job:";
            var SKUNumber = job.jobType.name == "Deodorization" ? "205-V420R" : "205-V084R";
            var batches = job.results.batchesRequired + (job.results.batchesRequired == 1 ? " batch" : " batches");
            message += "\n- Proklean V (Proklean Liquid): " + batches + " needed ("+ job.results.gallonsToPrepare +" Gallons with "+ job.results.liquidPackets + (job.results.liquidPackets == 1 ? " packet" : " packets") +") — SKU Number: " + SKUNumber;

            if(job.jobType.name == "Deodorization"){
                var packets = job.results.gasPackets + (job.results.gasPackets == 1 ? " packet" : " packets");
                message += "\n- Proklean G (Proklean Gas): " + packets + " — SKU Number: 205-GF025RNC";
            }

            message += "\n\n---------------\nROOMS\n---------------\n";
            $.each(job.rooms, function(index, room){
                if(room.include){
                    var roomResults = room.getResults(job.jobType);
                    message += "\n- " +  room.name;
                    message += "\n   W: " + room.width + ", L: " + room.length + ", H: " + room.height;
                    message += "\n   (" + room.area + " sq ft, " + room.volume + " cu ft)";
                    message += "\n   Gallons for Proklean V (Proklean Liquid): " + roomResults.gallonsRequired;
                    if(job.jobType.jobCategory == odorJobCategory){
                        message += "\n   Packets for Proklean G (Proklean Gas): " + roomResults.gasPackets;
                    }
                    message += "\n";
                }
            });

            message += "\n---------------------------\nPROKLEAN V (LIQUID) APPLICATION\n---------------------------\n";
            message += "- Follow all safety and PPE instructions.\n- Tear open foil pouch, activate in water for 1 hour.\n- Apply liquid per room instructions.\n";

            if(job.jobType.name == "Deodorization"){
                message += "\n------------------------\nPROKLEAN G (GAS) APPLICATION\n------------------------\n";
                message += "- Follow all safety instructions for gas deployment.\n- Place activated pouches in water, allow gas to work 4-6 hours.\n- Ventilate for 1 hour before re-entry.\n";
            }

            message += "\n---------------\nGlossary\n---------------\n";
            message += "- Batch: 5 gallons of Proklean V (Liquid)\n";
            message += "- Packets: Foil packets with inner white pouches\n";
            message += "- Pouch(es): Mixture that creates liquid or gas ClO2\n";
            message += "- Proklean V (Liquid) and Proklean G (Gas) - our products\n";
            message += "- Job Type - Disinfection or Deodorization\n";

            return message;
        }

        $("#getInstructions").click(function() {
            if(!$(this).hasClass("activate")) return;

            const job = new Job($("#calculator"));
            const instructions = createEmailForJob(job);

            $("#instructions").html(`<textarea style="width:100%; height:400px;">${instructions}</textarea>`);
            $("#myModal").show();
        });

    }

    const Modal = function() {
        if(navigator.userAgent.match(/(iPhone|iPod)/g)){
            $("#copybutton").hide();
        }

        $(".close").click(function() {
            $("#myModal").hide();
        });

        $(window).click(function(event){
            if(event.target.id == "myModal") $("#myModal").hide();
        });
    }

    // Initialize everything
    CalcController();
    Modal();

});
