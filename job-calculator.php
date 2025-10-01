<?php
/**
 * Plugin Name: Job Calculator
 * Plugin URI:  https://prokleanservices.com
 * Description: Job calculator for disinfection/deodorization projects.
 * Version:     1.0
 * Author:      Jason Rodgers
 * Author URI:  https://redgraffix.com
 */

if (!defined('ABSPATH')) exit;

// Enqueue JS and CSS
function jc_enqueue_scripts() {
    $plugin_url = plugin_dir_url(__FILE__);
    wp_enqueue_style('jc-styles', $plugin_url . 'styles.css');
    wp_enqueue_script('jc-js', $plugin_url . 'pk-calc_hidden.js', array('jquery'), false, true);
    wp_add_inline_script('jc-js', 'CalcController(); Modal();');
}
add_action('wp_enqueue_scripts', 'jc_enqueue_scripts');

// Shortcode to display calculator
function jc_display_calculator() {
    ob_start(); ?>
    <div id="calculator">
        <div class="row calc-row bg-white">
            <div class="col-4 col-tablet-6 col-mobile-12">
                <div>
                    <div id="jobTypesContainer">                    
                        <div style="position: relative; width:100%;">
                            <select class="box" id="jobTypes"></select>
                            <div class="arrow down">▼</div>
                        </div>
                    </div>
                    <div id="leftcol">
                        <div id="addNewRoomContainer" class="box blue">
                            <input type="button" id="addNewRoom" value="Add Room" />
                            <div class="arrow add">+</div>
                        </div>
                        <div>
                            <div style="position: relative;">
                                <input class="box blue" type="button" id="getInstructions" value="Get Instructions" />
                                <div class="arrow right">→</div>
                            </div>
                        </div>
                        <div style="position: relative;">
                            <a style="display: block;" class="resetButton box blue" href="#">Reset Form</a>
                            <div class="arrow reset">↺</div>
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
            <div class="col-5 col-tablet-6 col-mobile-12">
                <div id="roomList">&nbsp;</div>
            </div>
            <div class="col-3 col-tablet-6 col-mobile-12">
                <div id="disinfection-labels" style="display: none;">
                    <img src="https://prokleanservices.com/wp-content/uploads/2025/10/PK-restore-l-Fornt-cover.jpg" />
                </div>
                <div id="deodorization-labels" style="display: none;">
                    <img src="https://prokleanservices.com/wp-content/uploads/2024/08/ProKlean-Restore-DL-5gal-showcase-photo.jpg" style="margin-bottom: 15px;" />
                    <img src="https://prokleanservices.com/wp-content/uploads/2024/06/ProKlean-DFG-Packet-Photo-2.jpg" />
                </div>
                <div id="cleanair-labels" style="display: none;">
                    <img src="https://prokleanservices.com/wp-content/uploads/2025/09/prokleanFG-pack-front.jpg" />
                </div>
            </div>
        </div>

        <div id="myModal" class="modal" style="display: none;">
            <div class="content">
                <div class="modal-content">
                    <div class="modal-header">
                        <span class="close">✖</span>
                        <h2>ProKlean Instructions</h2>
                    </div>
                    <div class="modal-body" id="instructions">&nbsp;</div>
                    <div class="modal-footer">
                        <input type="button" id="copybutton" value="Copy to Clipboard" />
                        <input type="button" id="printbutton" value="Print Instructions" />
                    </div>
                </div>
            </div>
        </div>
    </div>
    <?php
    return ob_get_clean();
}
add_shortcode('job_calculator', 'jc_display_calculator');
