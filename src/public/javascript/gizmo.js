
// Handling of queue gizmo widgets
function gizmoManager() {
    // Object storing info on filters & names for each gizmo-widget
    let gizmos = null;
    // ID tracking
    let lastGizmoId = 0;
    // which gizmo has a menu open?
    let openGizmoMenu = null;

    function build(id=null) {
        let template = document.getElementById('gizmo-template');
        let gizmo = template.cloneNode(true);

        // update classes to those of a live, wild gizmo
        gizmo.classList.remove('template');
        gizmo.classList.add('gizmo');

        // Create an ID and append to DOM
        if (id == null) {
            id = 'gizmo-' + (lastGizmoId+1);
            lastGizmoId++;
        }
        gizmo.id = id;
        $('.gizmo-wrapper').append(gizmo);

        // Add to gizmos object, but don't overwrite existing ones
        if (!gizmos[id]) {
            gizmos[id] = {
                name: 'New one!',
                skillFilter: []
            }
        }
        // set name for DOM
        $(gizmo).find('.department-name').html(gizmos[id].name);

        setupInteractions(id);
        return id;
    }

    function remove(gizmoID) {
        document.getElementById(gizmoID).remove();
        delete gizmos[gizmoID];
        save();
    }

    // Which gizmo is currently edited in the skill menu? This function will
    // update that gizmo's attributes.
    function updateCurrent(name, skills) {
        gizmos[openGizmoMenu].name        = name;
        gizmos[openGizmoMenu].skillFilter = skillStringToArray(skills);
    }

    // Set up menu interactions for a gizmo with the given ID
    function setupInteractions(id) {
        let gizmo = $('#' + id);

        // Skills menu
        gizmo.find('.skills-edit-toggle').click(function (event) {
            // Show the modal...
            $('.modal').css('display', 'block');
            // Track currently open menu...
            openGizmoMenu = id;
            // And set modal values to match this gizmo
            $('.modal').find('.gizmo-name').val(gizmos[id].name);
            $('.modal').find('.skills').val(gizmos[id].skillFilter);
        });

        // Show/hide queue list
        gizmo.find('.show-skills-list').click(function (event) {
            gizmo.find('.queue-list').toggleClass('hidden');
            gizmos[id].showQueueList = !gizmos[id].showQueueList;
        });
    }

    // set up modal window for editing skills.
    $('.modal').find('.close, .cancel, .save').click(() =>
        $('.modal').css('display', 'none')
    );
    $('.modal').find('.remove').click(() => {
        $('.modal').css('display', 'none');
        remove(openGizmoMenu);
    });
    $(window).click((event) => {
        if ($(event.target).is('.modal'))
            $('.modal').css('display', 'none');
    });
    // Listen for skill filter updates
    $('.modal .save').click(() => {
        const name   = $('.modal .gizmo-name').val();
        const skills = $('.modal .skills').val();
        $('#' + openGizmoMenu).find('.department-name').html(name);
        updateCurrent(name, skills);
        save();
    });
    // Listen for add-gizmo button
    $('.add-gizmo').click(() => {
        let newID = build();
        // save current state to local storage
        save();
    });


    // Save gizmos to local storage
    function save() {
        const data = JSON.stringify(gizmos);
        localStorage.setItem('user_gizmos', data);
    }

    // Load gizmos from local storage on startup
    function load() {
        let data = localStorage.getItem('user_gizmos');
        if (!data) {
            gizmos = {};
        } else {
            gizmos = JSON.parse(data);
            console.log('Loading gizmos:', gizmos);
            // Build view
            for (const id of Object.keys(gizmos)) {
                build(id);
                lastGizmoId++;
            };
        }
    }


    load();
    // Module exports
    let exports = {};
    exports.build = build;
    exports.gizmos = gizmos;
    exports.updateCurrent = updateCurrent;
    exports.save = save;
    exports.load = load;
    exports.remove = remove;
    return exports;
}
