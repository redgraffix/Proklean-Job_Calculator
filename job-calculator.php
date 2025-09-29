<?php
/*
Plugin Name: Job Calculator
Description: A custom deodorizer/job calculator that runs inside a WordPress page.
Version: 1.0
Author: You
*/

function job_calculator_shortcode() {
    ob_start(); ?>

    <div id="calculator">
        <div class="row calc-row bg-white">
            <div class="col-3 col-tablet-6 col-mobile-12">
                <div>
                    <div id="jobTypesContainer">
                        <h3>Job Type</h3>
                        <div style="position: relative;">
                            <select class="box" id="jobTypes"></select>
                            <div class="arrow down">
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                    <div id="leftcol">
                        <div id="addNewRoomContainer" class="box blue">
                            <input type="button" id="addNewRoom" value="Add Room" />
                            <div class="arrow add">
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                        <div>
                            <div style="position: relative;">
                                <input class="box blue" type="button" id="getInstructions" value="Get Instructions" />
                                <div class="arrow right">
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        </div>
                        <div style="position: relative;">
                            <a style="display: block;" class="resetButton box blue" href="#">Reset Form</a>
                            <div class="arrow reset">
                                <span></span>
                                <span></span>
                            </div>
                        </div>

                        <div id="projectResults" class="box">
                            <p class="roomTotals">Totals</p>
                            <hr />
                            <div id="roomCount">Rooms: <strong><span id="answer"></span></strong></div>
                            <div id="sizes">
                                <div id="squareFeet">Square Feet: <strong><span id="answer"></span></strong></div>
                                <div id="cubicFeet">Cubic Feet: <strong><span id="answer"></span></strong></div>
                            </div>

                            <div id="calculations">
                                <div id="gasPacketsToUse">Gas Packets Needed: <strong><span id="answer"></span></strong></div>
                                <div id="gallonsRequired">Gallons Required: <strong><span id="answer"></span></strong></div>
                                <div id="gallonsToPrepare">Gallons To Prepare: <strong><span id="answer"></span></strong></div>
                                <div id="liquidPacketsToUse">Liquid Packets Needed: <strong><span id="answer"></span></strong></div>
                            </div>
                            <div id="recalculateButton" class="box blue">Recalculate</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-6 col-tablet-6 col-mobile-12">
                <div id="roomList">&nbsp;</div>
            </div>

            <div class="col-3 col-tablet-6 col-mobile-12">
                <div id="disinfection-labels" style="display: none;">
                    <img src="<?php echo plugin_dir_url(__FILE__); ?>l.png" />
                </div>
                <div id="deodorization-labels" style="display: none;">
                    <img src="<?php echo plugin_dir_url(__FILE__); ?>l.png" style="margin-bottom: 15px;" />
                    <img src="<?php echo plugin_dir_url(__FILE__); ?>g.png" />
                </div>
            </div>
        </div>

        <div id="myModal" class="modal" style="display: none;">
            <div class="content">
                <div class="modal-content">
                    <div class="modal-header">
                        <span class="close"><p>&times;</p></span>
                        <h2>ProKure Instructions</h2>
                    </div>
                    <div class="modal-body" id="instructions">&nbsp;</div>
                    <div class="modal-footer">
                        <h3>
                            <input type="button" id="copybutton" value="Copy to Clipboard" />
                        </h3>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Load CSS + JS -->
    <link rel="stylesheet" href="<?php echo plugin_dir_url(__FILE__); ?>styles.css">
    <script src="https://code.jquery.com/jquery-3.6.1.min.js"></script>
    <script src="<?php echo plugin_dir_url(__FILE__); ?>pk-calc-new.js"></script>
    <script>
      jQuery(document).ready(function($) {
          if (typeof CalcController === "function") CalcController();
          if (typeof Modal === "function") Modal();
      });
    </script>

    <?php
    return ob_get_clean();
}
add_shortcode('job_calculator', 'job_calculator_shortcode');
