// Handling of queue gizmo widgets
const gizmoManager = (function() {
    // Info on filters & names for each gizmo-widget
    const gizmos = {};
    // ID tracking
    let lastGizmoId = 1;

    function buildGizmo() {
        let template = document.getElementById('gizmo-template');
        let gizmo = template.cloneNode(true);

        // update classes to those of a live, wild gizmo
        gizmo.classList.remove('template');
        gizmo.classList.add('gizmo');

        gizmo.id = 'gizmo-' + (lastGizmoId + 1);
        lastGizmoId++;
        $('.gizmo-wrapper').append(gizmo);
    }

    function setupGizmoInteractions(gizmo) {
        // Handle menu to change skills (modal)
        $('.skills-edit-toggle').click(function () {
            $('.modal').css('display', 'block');
            openGizmoMenu = $(this).parent().attr('id');
        });
        $('.close, .cancel, .save').click(() => $('.modal').css('display', 'none'));
        $(window).click((event) => {
            if ($(event.target).is('.modal'))
                $('.modal').css('display', 'none');
        })

        // Listen for skill filter updates
        $('.modal .save').click(() => {
            const name   = $('.modal .gizmo-name').val();
            const skills = $('.modal .skills').val();
            if (!gizmos[openGizmoMenu]) gizmos[openGizmoMenu] = {};
            gizmos[openGizmoMenu].name        = name;
            gizmos[openGizmoMenu].skillFilter = skillStringToArray(skills);
        });

        // Add new gizmos on + press
        $('.add-gizmo').click(() => {
            gizmoManager.buildGizmo();
        });
    }

    let exports = {};
    exports.buildGizmo = buildGizmo;
    exports.gizmos = gizmos;
    return exports;
})();
