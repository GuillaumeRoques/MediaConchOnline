function initPage() {
    mcoMessage.init('#policyInfo div');
    policyTree.init();

    // Make buttons in policy rule form display inline
    // Duplicate button
    $('#xslPolicyRule_DuplicateRule').parent().addClass('xslPolicyRuleDuplicateButton');
    $('#xslPolicyRuleMt_DuplicateRule').parent().addClass('xslPolicyRuleDuplicateButton');
    // Save button
    $('#xslPolicyRule_SaveRule').parent().addClass('xslPolicyRuleSaveButton');
    $('#xslPolicyRuleMt_SaveRule').parent().addClass('xslPolicyRuleSaveButton');
    // Delete button
    $('#xslPolicyRule_DeleteRule').parent().addClass('xslPolicyRuleDeleteButton');
    $('#xslPolicyRuleMt_DeleteRule').parent().addClass('xslPolicyRuleDeleteButton');

    policyTreeAffix.init();
    formBindings();
    buttonBindings();
    setSelect2Plugin();
    policyEditHelp()
}

function setSelect2Plugin() {
    // Use select2 jquery plugin
    $('#xslPolicyRule_trackType').select2({
        theme: 'bootstrap',
        width: '100%',
        minimumResultsForSearch: Infinity
    });

    $('#xslPolicyRule_validator').select2({
        theme: 'bootstrap',
        width: '100%',
        minimumResultsForSearch: Infinity
    });

    $('#xslPolicyRuleMt_validator').select2({
        theme: 'bootstrap',
        width: '100%',
        minimumResultsForSearch: Infinity
    });

    $('#xslPolicyRule_field').select2({
        tags: true,
        theme: 'bootstrap',
        width: '100%'
    });

    // Replace input text by select
    $('#xslPolicyRule_value').replaceWith('<select id="' + $('#xslPolicyRule_value').prop('id') + '"  name="' + $('#xslPolicyRule_value').prop('name') + '"class="' + $('#xslPolicyRule_value').prop('class') + '">')
    $('#xslPolicyRule_value').select2({
        tags: true,
        theme: 'bootstrap',
        width: '100%'
    });
}

function formBindings() {
    // Import policy form
    $('form[name="xslPolicyImport"]').on('submit', function (e) {
        e.preventDefault();

        policyTreeAjax.policyImport($(this));
    });

    // Policy edit form
    $('form[name="xslPolicyInfo"]').on('submit', function (e) {
        e.preventDefault();

        policyTreeAjax.policyEdit($(this), policyTree.getSelectedNode());
    });

    // Policy rule edit form
    $('form[name="xslPolicyRule"]').on('submit', function (e) {
        e.preventDefault();

        // Duplicate
        if ('xslPolicyRule_DuplicateRule' == $('button[type=submit][clicked=true]').prop('id')) {
            policyTreeAjax.ruleDuplicate(policyTree.getParentPolicyId(), policyTree.getSelectedNode(), policyTree.getParentPolicy());
        }
        // Delete
        else if ('xslPolicyRule_DeleteRule' == $('button[type=submit][clicked=true]').prop('id')) {
            policyTreeAjax.ruleDelete(policyTree.getParentPolicyId(), policyTree.getSelectedNode());
        }
        // Edit
        else {
            policyTreeAjax.ruleEdit($(this), policyTree.getParentPolicyId(), policyTree.getSelectedNode());
        }
    });

    // Policy rule MT edit form
    $('form[name="xslPolicyRuleMt"]').on('submit', function (e) {
        e.preventDefault();

        // Duplicate
        if ('xslPolicyRuleMt_DuplicateRule' == $('button[type=submit][clicked=true]').prop('id')) {
            policyTreeAjax.ruleDuplicate(policyTree.getParentPolicyId(), policyTree.getSelectedNode(), policyTree.getParentPolicy());
        }
        // Delete
        else if ('xslPolicyRuleMt_DeleteRule' == $('button[type=submit][clicked=true]').prop('id')) {
            policyTreeAjax.ruleDelete(policyTree.getParentPolicyId(), policyTree.getSelectedNode());
        }
        // Edit
        else {
            policyTreeAjax.ruleEdit($(this), policyTree.getParentPolicyId(), policyTree.getSelectedNode());
        }
    });

    // Policy rule duplicate
    $('#xslPolicyRule_DuplicateRule').on('click', function (e) {
        e.preventDefault();

        policyTreeAjax.ruleDuplicate(policyTree.getParentPolicyId(), policyTree.getSelectedNode(), policyTree.getParentPolicy());
    });

    // Policy rule MT duplicate
    $('#xslPolicyRuleMt_DuplicateRule').on('click', function (e) {
        e.preventDefault();

        policyTreeAjax.ruleDuplicate(policyTree.getParentPolicyId(), policyTree.getSelectedNode(), policyTree.getParentPolicy());
    });

    // Policy rule delete
    $('#xslPolicyRule_DeleteRule').on('click', function (e) {
        e.preventDefault();

        policyTreeAjax.ruleDelete(policyTree.getParentPolicyId(), policyTree.getSelectedNode());
    });

    // Policy rule MT delete
    $('#xslPolicyRuleMt_DeleteRule').on('click', function (e) {
        e.preventDefault();

        policyTreeAjax.ruleDelete(policyTree.getParentPolicyId(), policyTree.getSelectedNode());
    });

    // Policy rule edit form trackType select list
    $('#xslPolicyRule_trackType').on('change', function() {
        if ('undefined' === $('#xslPolicyRule_field').val()) {
            var field = null;
        }
        else {
            var field = $('#xslPolicyRule_field').val();
        }

        policyTreeRulesMI.loadFieldsList($('#xslPolicyRule_trackType').val(), field);
        policyTreeRulesMI.displayOccurenceField($('#xslPolicyRule_trackType').val());
    });

    // Policy rule edit form field select list
    $('#xslPolicyRule_field').on('change', function() {
        policyTreeRulesMI.loadValuesList($('#xslPolicyRule_trackType').val(), $('#xslPolicyRule_field').val(), $('#xslPolicyRule_value').val());
    });

    // Policy rule edit form validator select list
    $('#xslPolicyRule_validator').on('change', function() {
        policyTreeRulesMI.displayValueField($('#xslPolicyRule_validator').val());
    })

    // Policy rule MT edit form validator select list
    $('#xslPolicyRuleMt_validator').on('change', function() {
        policyTreeRulesMT.displayValueField($('#xslPolicyRuleMt_validator').val());
    })

    // Multiple form button click
    $('form[name="xslPolicyRule"] button[type=submit]').on('click', function() {
        $('form[name="xslPolicyRule"] button[type=submit]').removeAttr('clicked');
        $(this).attr('clicked', true);
    });
}

function buttonBindings() {
    $('#policyDuplicate').on('click', function() {
        if ('s' == policyTree.getSelectedNode().type) {
            policyTreeAjax.policyDuplicate(policyTree.getSelectedNode(), policyTree.getInstance().get_node('u_p'));
        }
        else {
            policyTreeAjax.policyDuplicate(policyTree.getSelectedNode(), policyTree.getParentPolicy());
        }
    })

    $('#policyExport').on('click', function() {
        policyTreeAjax.policyExport(policyTree.getSelectedNode());
    })

    $('#policyDelete').on('click', function() {
        policyTreeAjax.policyDelete(policyTree.getSelectedNode());
    })

    $('#policyRuleCreate').on('click', function() {
        policyTreeAjax.ruleCreate(policyTree.getSelectedNode());
    })

    // Create policy
    $('.policyCreate').on('click', function () {
        policyTreeAjax.policyCreate(policyTree.getSelectedNode(), policyTree.getPolicyId());
    });

    // MediaInfo rule
    $('.ruleMediaInfo').on('click', function () {
        policyTreeRulesMI.display(policyTree.getSelectedNode());
    });

    // MediaTrace rule
    $('.ruleMediaTrace').on('click', function () {
        policyTreeRulesMT.display(policyTree.getSelectedNode());
    });

    // Reload page
    $('.reload-page').on('click', function () {
        location.reload();
    });
}

function policyEditHelp() {
    // Keep popover open while hover on the popover content
    var popoverManualBinding = function(elem) {
        elem.on('mouseenter', function () {
            var _this = this;
            $(this).popover('show');
            $('.popover').on('mouseleave', function () {
                $(_this).popover('hide');
            });
        }).on('mouseleave', function () {
            var _this = this;
            setTimeout(function () {
                if (!$('.popover:hover').length) {
                    $(_this).popover('hide');
                }
            }, 300);
        });
    }

    // License
    $('label[for="xslPolicyInfo_policyLicense"]').append('&nbsp;<span class="glyphicon glyphicon-info-sign policyLicenseHelp" aria-hidden="true"></span>');
    var policyLicenseHelp = $('.policyLicenseHelp').popover({title: 'Help', content: '<ul><li>Creative Commons Zero (1.0 or later): I like public domain</li><li>Creative Commons Attribution (4.0 or later): I want it permissive</li><li>Creative Commons Attribution-ShareAlike (4.0 or later): I care about sharing improvements</li><li>Other: a license not in the predefined list</li><footer>More information about how to choose a license for your policies may be found on <a href="https://creativecommons.org/share-your-work/" target="_blank">Creative Commons website</a></footer>', placement: 'auto top', trigger: 'manual', html: true});
    popoverManualBinding(policyLicenseHelp);
}

$(document).ready(function () {
    initPage();
    policyTreeAjax.getData();
});
