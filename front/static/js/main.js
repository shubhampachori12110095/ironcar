var socket = io.connect('http://' + document.domain + ':' + location.port + '/car');

$(document).ready( function() {
    $('#model-group').hide();
    $('#status').hide();
    $('#control-group').hide();
    $('#speed-group').hide();
    $('#speed-limit').hide();
});

// -------- CONTROL MODE ------

$("[data-mode]").click(function(event) {
    event.preventDefault();
    var mode = $(this).data('mode');
    $("[data-mode]").each(function() {
    if($(this).hasClass('btn-primary'))
        $(this).toggleClass('btn-primary btn-outline-primary');
    });
    $("[data-mode]").removeClass('btn-primary');
    $(this).toggleClass('btn-outline-primary btn-primary');
    console.log(mode);
    socket.emit("mode_update", mode);

    if (mode == 'training') {
        $('#model-group').hide();
        $('#speed-group').hide();
        $('#speed-limit').show();
        $('#control-group').show();
        $('#starter').prop("disabled", false);
    }
    else if (mode == 'resting') {
        $('#model-group').hide();
        $('#control-group').hide();
        $('#speed-group').hide();
        $('#speed-limit').hide();
        $('#starter').prop("disabled", false);
    }
    else if (mode == 'auto') {
        $('#model-group').show();
        $('#speed-group').show();
        $('#control-group').hide();
        $('#speed-limit').show();
        // TODO disable if model loaded
        $('#starter').prop("disabled", false);
    }
    else { //Dirauto
        $('#model-group').show();
        $('#speed-group').hide();
        $('#control-group').hide();
        $('#speed-limit').show();
        // TODO disable if model loaded
        $('#starter').prop("disabled", false);
    }
});

// -------- SPEED MODE ------

$("[data-speed-mode]").click(function(event) {
    event.preventDefault();
    var mode = $(this).data('speed-mode');
    $("[data-speed-mode]").each(function() {
    if($(this).hasClass('btn-primary'))
        $(this).toggleClass('btn-primary btn-outline-primary');
    });
    $("[data-speed-mode]").removeClass('btn-primary');
    $(this).toggleClass('btn-outline-primary btn-primary');
    console.log(mode);
    socket.emit("speed_mode_update", mode);
});

// -------- MAX SPEED UPDATE -----------

function maxSpeedUdate(){
    var newMaxSpeed = document.getElementById("maxSpeedSlider").value ;
    socket.emit("max_speed_update", newMaxSpeed / 100.);
}

socket.on('max_speed_update_callback', function(data){
    $("#maxSpeed").text("Max speed limit: " + Math.round(data.speed*100) + "%");
});

// -------- COMMANDS -----------

$("[data-command-reversed]").click(function(event) {
    event.preventDefault();
    $("[data-command-reversed]").removeClass('btn-primary');
    $(this).toggleClass('btn-outline-primary btn-primary');

    var is_reversed = ! $(this).hasClass("btn-outline-primary");
    console.log(is_reversed);

    var value = 1;
    if (is_reversed) {
      value = -1
    }
    socket.emit("command_update", {'command': 'invert_dir', 'value': value});
});


$("[data-command]").on('input propertychange paste', function() {
    var command = $(this).data('command');
    var value = $(this).val();
    console.log(command);
    console.log(value);
    socket.emit("command_update", {'command': command, 'value': value});
});


// -------- KEYBOARD INPUT -----------

kinput.onkeydown = kinput.onkeyup = kinput.onkeypress = handle;

function handle(e) {

    var elem = $("#control");

    // Gas control
    if (e.key == "ArrowDown" && e.type == "keydown" && !e.repeat){elem.removeClass().addClass('oi oi-caret-bottom'); socket.emit("gas", -1);}
    if (e.key == "ArrowUp" && e.type == "keydown" && !e.repeat){elem.removeClass().addClass('oi oi-caret-top'); socket.emit("gas", 1);}
    if (e.key == "ArrowUp" && e.type == "keyup" && !e.repeat){elem.removeClass().addClass('oi oi-media-pause'); socket.emit("gas", 0);}
    if (e.key == "ArrowDown" && e.type == "keyup" && !e.repeat){elem.removeClass().addClass('oi oi-media-pause'); socket.emit("gas", 0);}

    // Directoin control
    if (e.key == "ArrowLeft" && e.type == "keydown" && !e.repeat){elem.removeClass().addClass('oi oi-caret-left'); socket.emit("dir", -1);}
    if (e.key == "ArrowRight" && e.type == "keydown" && !e.repeat){elem.removeClass().addClass('oi oi-caret-right'); socket.emit("dir", 1);}
    if (e.key == "ArrowLeft" && e.type == "keyup" && !e.repeat){elem.removeClass().addClass('oi oi-media-pause'); socket.emit("dir", 0);}
    if (e.key == "ArrowRight" && e.type == "keyup" && !e.repeat){elem.removeClass().addClass('oi oi-media-pause'); socket.emit("dir", 0);}

}

// -------- STARTER -----------

$("#starter").click(function( event ) {
  event.preventDefault();
  console.log('starter');
  socket.emit('starter');
});

socket.on('starter_switch', function(data){
    var state = 'Stop';
    if (data.activated == false){
        state = 'Start';
        $('[data-mode').prop("disabled",false);
        $("#starter").removeClass('btn-danger').addClass('btn-success');
    } else {
        $('[data-mode').prop("disabled",true);
        $("#starter").removeClass('btn-success').addClass('btn-danger');
    }

    $("#starter").html(state);
});


// --------- START CAMERA ---------

$("#camera").click(function(event) {
    event.preventDefault();
    socket.emit('streaming_starter');
});

socket.on('stream_switch', function(data) {
    state = "Stop camera";

    if (data.activated == false){
        state = "Start camera";
        $("#camera").removeClass('btn-danger').addClass('btn-info');
        $('#dirline').attr('visibility', 'hidden');
    } else {
        $("#camera").removeClass('btn-info').addClass('btn-danger');
        $('#dirline').attr('visibility', 'visible');
    }

    $("#camera").html(state);
});

// --------- TAKE PICTURE ---------

$("#take-picture").click(function(event) {
    event.preventDefault();
    window.open('/picture','_blank');
});


// -------- AUTOPILOT MODEL -----------

socket.on('new_available_model', function(modelList){
    var mySelect = $("#model_select");
    var options_html = "<option selected>Choose model...</option>";
    for (var i = 0; i < modelList.length; i++) {
        options_html += '<option>';
        options_html += modelList[i];
        options_html += '</option>';
    }
    mySelect.html(options_html);
});


$( "#model_select" ).change(function() {
    var modelName = $(this).val();
    console.log(modelName);
    if(modelName != "Choose model...")
        socket.emit('model_update', modelName);
});

socket.on("model_update", function(modelSelected){
    var mySelect = document.getElementById("model_select");
    for (var i = 0; i < mySelect.options.length; i++) {
        if (modelSelected == mySelect.options[i].text){
            var modelIndex = i;
        }
    }
    mySelect.selectedIndex = modelIndex;
});


socket.on('picture_stream', function(data) {
    // TODO Check
    // data = { image: true, buffer: img_base64, index: index_class}

    if (data.image) {

        $('#stream_image').attr('xlink:href', 'data:image/jpeg;base64,' + data.buffer);

        // TODO find acc and angle in image name
        // TODO verify if correct. Here we assert many things
        var steer_to_arrow = ['35','80','125','150','175'];
        if (steer_to_arrow == '-1') {
            $('#dirline').attr('visibility', 'hidden');
        } else {
            $('#dirline').attr('visibility', 'visible');
            $('#dirline').attr('x2', steer_to_arrow[data.index]);
        }
        $('.start').hide();
        $('.stop').show();
    }
});

// -------- USER INFO -----------

// Message to the user
socket.on('msg2user', function(data){
    // TODO hide / show box + change color for success / warning / ...
    // Format {'type': 'type', 'msg': 'message'}
    // type is a bootstrap alert style type :
    // primary, secondary, success, danger, warning, info, light, dark, link
    // https://getbootstrap.com/docs/4.0/components/alerts/
    $("#status").show();
    $("#status").removeClass().addClass('alert alert-' + data.type);
    $("#status").text(data.msg);
});

socket.on('disconnect', function() {
    $("#serverStatus").removeClass().addClass('badge badge-danger');
    $("#serverStatus").text('Connection lost !');
});

socket.on('connect', function(client) {
    $("#serverStatus").removeClass().addClass('badge badge-success');
    $("#serverStatus").text('Connected');
});


// TODO FIX weird behavior. Sockets don't work if we remove this line at the end of the file... strange !
socket = io();
