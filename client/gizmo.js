
// Handling of queue gizmo widgets
const gizmo = (function() {
    console.log('starting fun');
    // Info on filters & names for each gizmo-widget
    const gizmos = {};
    // ID tracking
    let lastGizmoId = -1;
    // which gizmo has a menu open?
    openGizmoMenu = null;

    function build() {
        let template = document.getElementById('gizmo-template');
        let gizmo = template.cloneNode(true);

        // update classes to those of a live, wild gizmo
        gizmo.classList.remove('template');
        gizmo.classList.add('gizmo');

        gizmo.id = 'gizmo-' + (lastGizmoId + 1);
        lastGizmoId++;
        $('.gizmo-wrapper').append(gizmo);

        gizmos[gizmo.id] = {
            name: 'New one!',
            skillFilter: []
        }
        setupInteractions(gizmo.id);
        return gizmo.id;
    }

    function setupInteractions(gizmoID) {
        let gizmo = $('#' + gizmoID);

        gizmo.find('.skills-edit-toggle').click(function () {
            $('.modal').css('display', 'block');
            openGizmoMenu = gizmoID;
        });
    }

    // Which gizmo is currently edited in the skill menu? This function will
    // update that gizmo's attributes.
    function updateCurrent(name, skills) {
        gizmos[openGizmoMenu].name        = name;
        gizmos[openGizmoMenu].skillFilter = skillStringToArray(skills);
    }


    // set up modal window for editing skills.
    $('.modal').find('.close, .cancel, .save').click(() =>
        $('.modal').css('display', 'none')
    );
    $(window).click((event) => {
        if ($(event.target).is('.modal'))
            $('.modal').css('display', 'none');
    });
    // Listen for skill filter updates
    $('.modal .save').click(() => {
        const name   = $('.modal .gizmo-name').val();
        const skills = $('.modal .skills').val();
        updateCurrent(name, skills);
    });

    // Listen for add-gizmo button
    $('.add-gizmo').click(() => {
        let newID = build();
    });



    // Module exports
    let exports = {};
    exports.build = build;
    exports.gizmos = gizmos;
    exports.updateCurrent = updateCurrent;
    return exports;
})();
