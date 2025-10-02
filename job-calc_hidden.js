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
            this.nameInput = this.node.find(".nameInput");
            this.name = this.nameInput.val();
            this.results = new Results();
            var self = this;

            $.each(["length", "width", "height"], function(index, property){
                self[property] = parseFloat(self.node.find("."+ property +"Input").val());
                if(isNaN(self[property])) self[property] = 0;
            });

            this.include = this.node.find(".include").prop('checked');
            this.area = this.width * this.length;
            this.volume = this.area * this.height;

            this.nameInput.on("input", function(){
                self.name = $(this).val();
            });

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

        function JobCategory(name) { this.name = name; }
        const pathogenJobCategory = new JobCategory("Pathogen");
        const odorJobCategory = new JobCategory("Odor");
        const airJobCategory = new JobCategory("Air");

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
            new JobType("Disinfection", pathogenJobCategory, standardStrength),
            new JobType("Clean The Air You Breath", airJobCategory, standardStrength)
        ].sort((a,b) => a.name.localeCompare(b.name));

        const jobTypesByName = {};
        $.each(jobTypes, function() { jobTypesByName[this.name] = this; });

        const $jobTypesDropdown = $("#jobTypes");
        $jobTypesDropdown.empty().append("<option selected disabled>Select Job Type</option>");
        $.each(jobTypes, function(i, jt){
            $jobTypesDropdown.append(`<option value='${jt.name}'>${jt.name}</option>`);
        });

        $("#getInstructions").removeClass("activate");

        const createRoom = function() {
            var currentRoomNumber = $(".room").length + 1;
            var room = $("<div />").addClass("room").attr("id","room"+currentRoomNumber);
            room.append($("<div><input type='text' class='nameInput' value='Room No. "+currentRoomNumber+"'> <input type='checkbox' checked class='include'></div>"));
            room.append($("<div><p>Length</p><input type='number' class='input lengthInput' value='1'></div>"));
            room.append($("<div><p>Width</p><input type='number' class='input widthInput' value='1'></div>"));
            room.append($("<div class='odorStuff'><p>Height</p><input type='number' class='input heightInput' value='1'></div>"));

            var results = $("<div />").addClass("results");
            results.append($("<div>Square Feet:&nbsp;<strong><span class='squareFeet'>0</span></strong></div>"));
            results.append($("<div class='odorStuff'>Cubic Feet:&nbsp;<strong><span class='cubicFeet'>0</span></strong></div>"));
            results.append($("<div class='odorStuff'>Gas Packets:&nbsp;<strong><span class='odorPacketsToUse'>0</span></strong></div>"));
            room.append(results);

            $("#roomList").append(room);
        };

        const recalcAndReset = function(){
            const job = new Job($("#calculator"));
            $("#calculations").show();
            $("#recalculateButton").hide();

            if(!job.jobType){ 
                $(".odorStuff").hide();
                $('#cubicFeet').hide();
                $('#disinfection-labels').hide();
                $('#deodorization-labels').hide();
                $('#cleanair-labels').hide();
                return;
            }

            if(job.jobType.jobCategory.name == "Odor"){
                $(".odorStuff").show();
                $('#cubicFeet').show();
                $('#disinfection-labels').hide();
                $('#deodorization-labels').show();
                $('#cleanair-labels').hide();
            } else if(job.jobType.jobCategory.name == "Pathogen"){
                $(".odorStuff").hide();
                $('#cubicFeet').hide();
                $('#disinfection-labels').show();
                $('#deodorization-labels').hide();
                $('#cleanair-labels').hide();
            } else if(job.jobType.jobCategory.name == "Air"){
                $(".odorStuff").show();
                $('#cubicFeet').show();
                $('#disinfection-labels').hide();
                $('#deodorization-labels').hide();
                $('#cleanair-labels').show();
            }
        };

        createRoom();
        recalcAndReset();

        $(document).on('change', "#jobTypes", function(){
            $("#getInstructions").toggleClass("activate", $(this).val() !== "");
            recalcAndReset();
        });

        $(document).on('change keyup input', ".input, .include, .nameInput", recalcAndReset);

        $("#addNewRoomContainer").click(function(){
            createRoom();
            recalcAndReset();
        });

        $(document).on('click', '.resetButton', function(e){
            e.preventDefault();
            $("#roomList").empty();
            createRoom();
            $("#jobTypes").val("");
            $("#getInstructions").removeClass("activate");
            recalcAndReset();
        });

        // Define all products and their detailed instructions per job type
        const productsByJobType = {
            "Deodorization": {
                liquidProducts: [
                    {
                        name: "ProKlean Restore DLPRO",
                        sku: "205-DL5R",
                        instructions: `Preparation
- It is a violation of Federal Law to use this product in a manner inconsistent with the labeling.  Read the entire label and use strictly in accordance with precautionary statements and use.
-  ENSURE THAT ALL REQUIRED PPE IS WORN.
-  Tear open the foil packet and remove the white inner pouch(es).
-  DO NOT CUT OR OPEN THE WHITE POUCH.
-  Place the white pouch(es) in an opaque (not clear) bottle or container filled with water based on the Job Type.
-  Allow pouch(es) to activate in water for one hour to reach maximum strength.
-  Transfer activated solution into applicator as needed.

Application
-  Heavily soiled surfaces must be pre-cleaned prior to treatment.
-  Spray directly onto surfaces to be treated.
-  No wipe, no rinse, no residue and will not harm most nonporous surfaces.
-  Easy to use, apply to surface and allow to air dry.
-  Pour (unused) liquid into a dark closed or sealed container in a cool, dark location.`
                    }
                ],
                gasProducts: [
                    {
                        name: "ProKlean Restore DFG",
                        sku: "205-DFG1000R",
                        instructions: `-  It is a violation of Federal Law to use this product in a manner inconsistent with the labeling.  Read the entire label and use strictly in accordance with precautionary statements and use.
-  Note: People and pets must not be present in enclosed area when ProKlean DFG (ProKlean DFG Gas) is activated.
-  Use ProKlean DLPRO (ProKlean DLPRO Liquid) at 500ppm then follow with ProKlean DFG (ProKlean DFG Gas) for best results on deodorization jobs.
-  ENSURE THAT ALL REQUIRED PPE IS WORN THROUGHOUT GAS DEPLOYMENT & VENTILATION.
-  Open the silver foil packet and remove the white pouch (DO NOT OPEN WHITE POUCH).
-  Drop white inner pouch in plastic cup filled with 1.5” of water.
-  Place on stable level surface, elevated in central location.
-  Allow at least 4-6 hours for the ProKlean DFG (ProKlean DFG Gas) to work.  (Not recommended for more than 24 hours).
-  Use the enclosed caution placard to record treatment/safe re-entry time.
-  Ventilate for one (1) hour before re-entry.  Discard in an outside refuse container.
-  Works best in the dark.
-  Place two feet from fabrics, leather, electronics, mirrors and uncoated metals.
-  Use ProKlean Rhino air movers to increase circulation.`
                    }
                ]
            },
            "Disinfection": {
                liquidProducts: [
                    {
                        name: "ProKlean Restore L",
                        sku: "205-L5R",
                        instructions: `Preparation
-  It is a violation of Federal Law to use this product in a manner inconsistent with the labeling.  Read the entire label and use strictly in accordance with precautionary statements and use.
-  ENSURE THAT ALL REQUIRED PPE IS WORN.
-  Tear open the foil packet and remove the white inner pouch(es).
DO NOT CUT OR OPEN THE WHITE POUCH.
-  Place the white pouch(es) in an opaque (not clear) bottle or container filled with water based on the Job Type.
-  Allow pouch(es) to activate in water for one hour to reach maximum strength.
-  Transfer activated solution into applicator as needed.

Application
-  Heavily soiled surfaces must be pre-cleaned prior to treatment.
-  Spray directly onto surfaces to be treated.
-  Spray must be used with an exposure time of 10 minutes at 100 ppm to disinfect hard, non-porous surfaces.
-  No wipe, no rinse, no residue and will not harm most nonporous surfaces.
-  Easy to use, apply to surface and allow to air dry.
-  Follow EPA label when using as a deodorizer on carpets and other color-fast soft goods; always test in a hidden area for colorfastness.
-  Pour (unused) liquid into a dark closed or sealed container in a cool, dark location.  Use stored liquid within 15 days of activation; record activation date onto the container.
-  DISINFECTION JOB TYPES REQUIRE ONLY PROKLEAN L (PROKLEAN RESTORE L LIQUID)`
                    }
                ],
                gasProducts: []
            },
            "Clean The Air You Breath": {
                liquidProducts: [],
                gasProducts: [
                    {
                        name: "ProKlean Restore FG",
                        sku: "205-FG2250R",
                        instructions: `-  It is a violation of Federal Law to use this product in a manner inconsistent with the labeling.  Read the entire label and use strictly in accordance with precautionary statements and use.
-  Note: People and pets must not be present in enclosed area when ProKlean FG (ProKlean FG Gas) is activated.
-  ENSURE THAT ALL REQUIRED PPE IS WORN THROUGHOUT GAS DEPLOYMENT & VENTILATION.
-  Open the silver foil packet and remove the white pouch (DO NOT OPEN WHITE POUCH).
-  Drop white inner pouch in plastic cup filled with 1.5” of water.
-  Place on stable level surface in central location.
-  Allow at least 4-6 hours for the ProKlean FG (ProKlean FG Gas) to work.  (Not recommended for more than 24 hours).
-  Use the enclosed caution placard to record treatment/safe re-entry time.
-  Ventilate for one (1) hour before re-entry.  Discard in an outside refuse container.
-  Works best in the dark.
-  Place two feet from fabrics, leather, electronics, mirrors and uncoated metals.
-  Use the ProKlean Rhino air mover to increase circulation and on Larger Jobs.

-  CLEAN THE AIR YOU BREATHE JOB TYPES REQUIRE ONLY PROKLEAN FG (PROKLEAN RESTORE FG Gas)`
                    }
                ]
            }
        };

        function createEmailForJob(job){
            var message = "You are about to work on a "+ job.jobType.name +" job type. Please read and follow directions carefully.\n\n";

            const products = productsByJobType[job.jobType.name];
            const liquidProducts = products.liquidProducts || [];
            const gasProducts = products.gasProducts || [];

            message += "This is what you will need to finish this job:";

            liquidProducts.forEach(p => {
                var batches = job.results.batchesRequired + (job.results.batchesRequired == 1 ? " batch" : " batches");
                message += `\n- ${p.name} (${p.sku}): ${batches} needed (${job.results.gallonsToPrepare} Gallons with ${job.results.liquidPackets} packets)`;
            });

            gasProducts.forEach(p => {
                var packets = job.results.gasPackets + (job.results.gasPackets == 1 ? " packet" : " packets");
                message += `\n- ${p.name} (${p.sku}): ${packets}`;
            });

            message += "\n\n---------------\nROOMS\n---------------\n";
            $.each(job.rooms, function(index, room){
                if(room.include){
                    var roomResults = room.getResults(job.jobType);
                    message += `\n- ${room.name}`;
                    message += `\n   W: ${room.width}, L: ${room.length}, H: ${room.height}`;
                    message += `\n   (${room.area} sq ft, ${room.volume} cu ft)`;
                    liquidProducts.forEach(p => message += `\n   Gallons for ${p.name}: ${roomResults.gallonsRequired}`);
                    gasProducts.forEach(p => message += `\n   Packets for ${p.name}: ${roomResults.gasPackets}`);
                    message += "\n";
                }
            });

            liquidProducts.forEach(p => {
                message += `\n---------------------------\n${p.name.toUpperCase()}\n---------------------------\n`;
                message += p.instructions + "\n";
            });

            gasProducts.forEach(p => {
                message += `\n---------------------------\n${p.name.toUpperCase()}\n---------------------------\n`;
                message += p.instructions + "\n";
            });

            message += "\n---------------\nGlossary\n---------------\n";
            message += "- Batch: 5 gallons of liquid product\n";
            message += "- Packets: Foil packets that contain the inner pouch(es)\n";
            message += "- Pouch(es): Contain mixture that creates liquid or gas ClO2\n";
            liquidProducts.forEach(p => message += `- ${p.name}: liquid product\n`);
            gasProducts.forEach(p => message += `- ${p.name}: gas product\n`);
            message += "- Job Type: Disinfection, Deodorization, or Air Treatment\n";

            return message;
        }

        $("#getInstructions").click(function(){
            if(!$(this).hasClass("activate")) return;
            const job = new Job($("#calculator"));
            const instructions = createEmailForJob(job);
            $("#instructions").html(`<textarea style="width:100%; height:400px;">${instructions}</textarea>`);
            $("#myModal").show();
        });

        $("#copybutton").click(function(){
            const $textarea = $("#instructions textarea");
            $textarea.select();
            document.execCommand("copy");
            alert("Instructions copied to clipboard!");
        });

        $("#printbutton").click(function(){
            const printWindow = window.open('', '', 'height=600,width=800');
            printWindow.document.write('<pre>' + $("#instructions textarea").val() + '</pre>');
            printWindow.document.close();
            printWindow.print();
        });

    }

    const Modal = function(){
        $(".close").click(function(){ $("#myModal").hide(); });
        $(window).click(function(event){ if(event.target.id === "myModal") $("#myModal").hide(); });
    }

    CalcController();
    Modal();

});
