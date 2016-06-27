$(document).ready(function() {
    $('div.content').css('min-height', function () {
        return $('.policyRightCol').outerHeight(true);
    })
    $('#policyFix').css('width', function () {
        return $('.policyRightCol').outerWidth(true);
    })

    $('#policyFix').affix({
        offset: {
            top: function () {
                return $('#collapse-1').outerHeight(true)
            },
            bottom: function () {
                return ($('footer').outerHeight(true))
            }
        }
    })

    $('#policyFix').on('affixed.bs.affix', function() {
        $('.affix').css('position', 'fixed');
    })

    $('#policyFix').on('affixed-top.bs.affix', function() {
        $('.affix-top').css('position', 'relative');
    })

    $('#policyFix').on('affixed-bottom.bs.affix', function() {
        $('.affix-bottom').css('position', 'relative');
    })

    $.get(Routing.generate('app_xslpolicy_xslpolicytreedata'))
    .done(function(data) {
        displayTree(data.policiesTree);
    })

    // Import policy form
    $('form[name="xslPolicyImport"]').on('submit', function (e) {
        e.preventDefault();

        $.ajax({
            type: $(this).attr('method'),
               url: Routing.generate('app_xslpolicy_xslpolicytreeimport'),
               data: new FormData($(this)[0]),
               processData: false,
               contentType: false
        })
        .done(function (data) {
            policyImport(data);
        })
        .fail(function (jqXHR) {
            failResponse(jqXHR, 'form[name="xslPolicyImport"]');
        })
    });

    function policyImport(policy) {
        policyNodeId = pTree.create_node('u_p', {text: policy.policyName, type: 'u', data: {policyId: policy.policyId}});
        $.each(policy.policyRules, function(ruleId, policyRule) {
            pTree.create_node(policyNodeId, policyRule);
        });
        pTree.deselect_node(pTree.get_selected(), true);
        pTree.select_node(policyNodeId);
        successMessage('Policy imported successfuly');
    }

    // Create policy form
    $('form[name="xslPolicyCreate"]').on('submit', function (e) {
        e.preventDefault();

        $.ajax({
            type: $(this).attr('method'),
               url: Routing.generate('app_xslpolicy_xslpolicytreecreate'),
               data: new FormData($(this)[0]),
               processData: false,
               contentType: false
        })
        .done(function (data) {
            policyCreate(data);
        })
        .fail(function (jqXHR) {
            failResponse(jqXHR, 'form[name="xslPolicyCreate"]');
        })
    });

    function policyCreate(policy) {
        policyNodeId = pTree.create_node('u_p', {text: policy.policyName, type: 'u', data: {policyId: policy.policyId}});
        pTree.deselect_node(pTree.get_selected(), true);
        pTree.select_node(policyNodeId);
        successMessage('Policy created successfuly');
    }

    // Policy rule edit form
    $('form[name="xslPolicyRule"]').on('submit', function (e) {
        e.preventDefault();
        policyNode = pTree.get_node(selectedRuleNode.parent);

        if ('xslPolicyRule_DuplicateRule' == $('button[type=submit][clicked=true]').prop('id')) {
            action = 'duplicate';
            routeAction = 'app_xslpolicy_xslpolicytreeruleedit';
        }
        else if ('xslPolicyRule_DeleteRule' == $('button[type=submit][clicked=true]').prop('id')) {
            action = 'delete';
            routeAction = 'app_xslpolicy_xslpolicytreeruledelete';
        }
        else {
            action = 'edit';
            routeAction = 'app_xslpolicy_xslpolicytreeruleedit';
        }

        $.ajax({
            type: $(this).attr('method'),
               url: Routing.generate(routeAction, {id: policyNode.data.policyId, ruleId: selectedRuleNode.data.ruleId, action: action}),
               data: new FormData($(this)[0]),
               processData: false,
               contentType: false
        })
        .done(function (data) {
            ruleAction(data, selectedRuleNode, action);
        })
        .fail(function (jqXHR) {
            failResponse(jqXHR, 'form[name="xslPolicyRule"]');
        })
    });

    function ruleAction(data, ruleNode, action) {
        if ('duplicate' == action) {
            ruleDuplicate(data, ruleNode);
        }
        else if ('delete' == action) {
            ruleDelete(data, ruleNode);
        }
        else if ('edit' == action) {
            ruleEdit(data, ruleNode);
        }
    }

    function ruleEdit(data, ruleNode) {
        ruleNode.text = data.rule.text;
        ruleNode.data = data.rule.data;
        pTree.redraw(true);
        successMessage('Policy rule successfully saved');
    }

    function ruleDuplicate(data, ruleNode) {
        policyNode = pTree.get_node(ruleNode.parent);
        ruleNodeId = pTree.create_node(policyNode, data.rule);
        pTree.select_node(ruleNodeId);
        pTree.deselect_node(ruleNode, true);
        successMessage('Policy rule successfully duplicated');
    }

    function ruleDelete(data, ruleNode) {
        policyNode = pTree.get_node(ruleNode.parent);
        pTree.deselect_node(ruleNode, true);
        pTree.select_node(policyNode, true);

        // Update ruleId for next nodes
        tmpRule = ruleNode;
        while (tmpRule = pTree.get_next_dom(tmpRule, true)) {
            nextNode = pTree.get_node(tmpRule);
            nextNode.data.ruleId = nextNode.data.ruleId - 1;
        }

        pTree.delete_node(ruleNode);

        successMessage('Policy rule successfully deleted');
    }

    function displayTree(policiesTree) {
        $('#policiesTree').jstree({
            'core' : {
                'check_callback' : function (operation, node, parent, position, more) {
                    if (operation === 'copy_node' || operation === 'move_node') {
                        return false; // disable copy and move
                    }
                    else {
                        return true;
                    }
                },
                'multiple' : false,
                'dblclick_toggle' : true,
                'data' : policiesTree
            },
            "plugins" : ['search', 'types'],
            'types' : {
                'default' : {'icon' : 'glyphicon glyphicon-folder-open'},
                'a' : {'icon' : 'glyphicon glyphicon-folder-open'},
                'u' : {'icon' : 'glyphicon glyphicon-folder-open'},
                's' : {'icon' : 'glyphicon glyphicon-folder-open'},
                'up' : {'icon' : 'glyphicon glyphicon-folder-open'},
                'sp' : {'icon' : 'glyphicon glyphicon-folder-open'},
                'r' : {'icon' : 'glyphicon glyphicon-file'},
            },
        });

        pTree = $('#policiesTree').jstree(true);
    }

    $('#policiesTree').on('ready.jstree', function () {
        var to = false;
        $('#policiesTreeSearch').keyup(function () {
            if(to) { clearTimeout(to); }
            to = setTimeout(function () {
                var v = $('#policiesTreeSearch').val();
                pTree.search(v);
            }, 250);
        });
    });

    $('#policiesTree').on('select_node.jstree', function (e, data) {
        data.instance.open_node(data.node);
        switch (data.node.type) {
            case 'r':
                if ('u' == data.instance.get_node(data.node.parent).type) {
                    displayPolicyRule(data.node, false);
                }
                else {
                    displayPolicyRule(data.node, true);
                }
                break;
            case 'up':
            case 'sp':
                displayPolicyManage(data.node);
                break;
            case 'u':
                displayPolicyEdit(data.node, false);
                break;
            case 's':
                displayPolicyEdit(data.node, true);
                break;
        }

        $('#policyFix').affix('checkPosition');
    });

    function displayPolicyManage(node) {
        $('.policyManage').removeClass('hidden');
        $('.policyEdit').addClass('hidden');
        $('.policyEditRule').addClass('hidden');
    }

    function displayPolicyEdit(node, system) {
        $('.policyManage').addClass('hidden');
        $('.policyEdit').removeClass('hidden');
        $('.policyEditRule').addClass('hidden');

        if (system) {
            $('#policyDelete').addClass('hidden');
            $('#policyRuleCreateContainer').addClass('hidden');
        }
        else {
            $('#policyDelete').removeClass('hidden');
            $('#policyRuleCreateContainer').removeClass('hidden');
        }

        $('.policyEdit .policyEditTitle').text(node.text);
        selectedPolicyNode = node;
    }

    $('#policyDuplicate').on('click', function() {
        $.get(Routing.generate('app_xslpolicy_xslpolicytreeduplicate', {id: selectedPolicyNode.data.policyId}))
        .done(function (data) {
            policyDuplicate(data, selectedPolicyNode);
        })
        .fail(function (jqXHR) {
            failResponse(jqXHR, '#policyDuplicate');
        })
    })

    function policyDuplicate(policy, selectedPolicyNode) {
        policyNodeId = pTree.create_node('p_u', {text: policy.policyName, type: 'u', data: {policyId: policy.policyId}});
        $.each(policy.policyRules, function(ruleId, policyRule) {
            pTree.create_node(policyNodeId, policyRule);
        });
        pTree.select_node(policyNodeId);
        pTree.deselect_node(selectedPolicyNode.id, true);
        successMessage('Policy successfuly duplicated');
    }

    $('#policyExport').on('click', function() {
        window.location = Routing.generate('app_xslpolicy_xslpolicyexport', {id: selectedPolicyNode.data.policyId});
    })

    $('#policyDelete').on('click', function() {
        $.get(Routing.generate('app_xslpolicy_xslpolicytreedelete', {id: selectedPolicyNode.data.policyId}))
        .done(function (data) {
            policyDelete(data);
        })
        .fail(function (jqXHR) {
            failResponse(jqXHR, '#policyDelete');
        })
    })

    function policyDelete(policy) {
        pTree.delete_node(selectedPolicyNode.id);
        pTree.select_node('u_p', true);
        successMessage('Policy successfuly removed');
    }

    $('#policyRuleCreate').on('click', function() {
        $.get(Routing.generate('app_xslpolicy_xslpolicytreecheck', {id: selectedPolicyNode.data.policyId}))
        .done(function (data) {
            rule = {text: 'New rule', type: 'r', data: {ruleId: 'new', trackType: '', field: '', occurrence: 1, validator: '', value: '', }};
            policyRuleCreate(rule, selectedPolicyNode);
        })
        .fail(function (jqXHR) {
            failResponse(jqXHR, '#policyRuleCreate');
        })
    })

    function policyRuleCreate(rule, policyNode) {
        ruleNode = pTree.create_node(policyNode, rule);
        pTree.select_node(ruleNode);
        pTree.deselect_node(policyNode.id, true);
    }

    if ($('#xslPolicyRule_DuplicateRule').length) {
        $('#xslPolicyRule_DuplicateRule').parent().addClass('xslPolicyRuleDuplicateButton');
        $('#xslPolicyRule_SaveRule').parent().addClass('xslPolicyRuleSaveButton');
        $('#xslPolicyRule_DuplicateRule').text('Duplicate');
        $('#xslPolicyRule_SaveRule').text('Save');
        $('#xslPolicyRule_DuplicateRule').parent().after('<div class="form-group xslPolicyRuleDeleteButton"><button id="xslPolicyRule_DeleteRule" class="btn btn-danger" type="submit">Delete');
    }

    // Multiple form button click
    $('form[name="xslPolicyRule"] button[type=submit]').on('click', function() {
        $('form[name="xslPolicyRule"] button[type=submit]').removeAttr('clicked');
        $(this).attr('clicked', true);
    });

    $('#xslPolicyRule_editor input[type=\'radio\']').parent().removeClass('required');
    $('#xslPolicyRule_editor').prev().removeClass('required');

    function displayPolicyRule(node, system) {
        $('.policyManage').addClass('hidden');
        $('.policyEdit').addClass('hidden');
        $('.policyEditRule').removeClass('hidden');
        $('#xslPolicyRule_title').val(node.text);
        $('#xslPolicyRule_trackType option[value="' + node.data.trackType + '"]').prop('selected', true);
        loadFieldsList(node.data.trackType, node.data.field);
        $('#xslPolicyRule_occurrence').val(node.data.occurrence);
        $('#xslPolicyRule_validator option[value="' + node.data.validator + '"]').prop('selected', true);
        $('#xslPolicyRule_value').val(node.data.value);
        $('#xslPolicyRule_valueFreeText').val(node.data.value);
        if ('is_true' == node.data.validator) {
            hideEditor();
            showFreetext();
        }
        else {
            hideFreetext();
            showEditor();
        }

        if (system) {
            $('#xslPolicyRule_title').prop('disabled', true);
            $('#xslPolicyRule_trackType').prop('disabled', true);
            $('#xslPolicyRule_field').prop('disabled', true);
            $('#xslPolicyRule_occurrence').prop('disabled', true);
            $('#xslPolicyRule_validator').prop('disabled', true);
            $('#xslPolicyRule_value').prop('disabled', true);
            $('#xslPolicyRule_valueFreeText').prop('disabled', true);
            $('#xslPolicyRule_editor input[type=\'radio\']').prop('disabled', true);
            $('#xslPolicyRule_SaveRule').addClass('hidden');
            $('#xslPolicyRule_DuplicateRule').addClass('hidden');
            $('#xslPolicyRule_DeleteRule').addClass('hidden');
        }
        else {
            $('#xslPolicyRule_title').prop('disabled', false);
            $('#xslPolicyRule_trackType').prop('disabled', false);
            $('#xslPolicyRule_field').prop('disabled', false);
            displayOccurenceField($('#xslPolicyRule_trackType').val());
            $('#xslPolicyRule_validator').prop('disabled', false);
            $('#xslPolicyRule_value').prop('disabled', false);
            $('#xslPolicyRule_valueFreeText').prop('disabled', false);
            $('#xslPolicyRule_editor input[type=\'radio\']').prop('disabled', false);
            $('#xslPolicyRule_SaveRule').removeClass('hidden');
            $('#xslPolicyRule_DuplicateRule').removeClass('hidden');
            $('#xslPolicyRule_DeleteRule').removeClass('hidden');
        }

        selectedRuleNode = node;
    }

    function loadFieldsList(trackType, value = null) {
        $.post(Routing.generate('app_xslpolicy_xslpolicyrulefieldslist'), {type: trackType})
        .done(function(data) {
            $('#xslPolicyRule_field').html('');
            $('#xslPolicyRule_field').append('<option value="">Choose a field</option>');
            $.each(data, function(k, v) {
                $('#xslPolicyRule_field').append('<option value="' + k + '">' + v + '</option>');
            });

            if (value) {
                $('#xslPolicyRule_field option[value="' + value + '"]').prop('selected', true)
            }
        })
        .fail(function () {
            $('#xslPolicyRule_field').html('');
            $('#xslPolicyRule_field').append('<option value="">Choose a field</option>');

            if (value) {
                $('#xslPolicyRule_field').append('<option value="' + value + '" selected>' + value + '</option>');
            }
        });
    }

    $('#xslPolicyRule_editor input[type=\'radio\']').on('change', function() {
        editor = $('#xslPolicyRule_editor input[type=\'radio\']:checked').val();
        if (1 == $('#xslPolicyRule_editor input[type=\'radio\']:checked').val()) {
            hideEditor();
            showFreetext();
        }
        else {
            hideFreetext();
            showEditor();
        }
    });

    function hideFreetext() {
        $('#xslPolicyRule_valueFreeText').parent().addClass('hidden');
        $('#xslPolicyRule_valueFreeText').removeClass('required');
        $('#xslPolicyRule_editor_1').prop('checked', false)
    }

    function showFreetext() {
        $('#xslPolicyRule_valueFreeText').parent().removeClass('hidden');
        $('#xslPolicyRule_valueFreeText').attr('required', true);
        $('#xslPolicyRule_editor_1').prop('checked', true)
    }

    function hideEditor() {
        $('#xslPolicyRule_trackType').parent().addClass('hidden');
        $('#xslPolicyRule_field').parent().addClass('hidden');
        $('#xslPolicyRule_occurrence').parent().addClass('hidden');
        $('#xslPolicyRule_validator').parent().addClass('hidden');
        $('#xslPolicyRule_value').parent().addClass('hidden');
        $('#xslPolicyRule_trackType').attr('required', false);
        $('#xslPolicyRule_field').attr('required', false);
        $('#xslPolicyRule_occurrence').attr('required', false);
        $('#xslPolicyRule_validator').attr('required', false);
        $('#xslPolicyRule_valueFreeText').attr('required', true);
        $('#xslPolicyRule_editor_0').prop('checked', false)
    }

    function showEditor() {
        $('#xslPolicyRule_trackType').parent().removeClass('hidden');
        $('#xslPolicyRule_field').parent().removeClass('hidden');
        $('#xslPolicyRule_occurrence').parent().removeClass('hidden');
        $('#xslPolicyRule_validator').parent().removeClass('hidden');
        displayValueField($('#xslPolicyRule_validator').val());
        $('#xslPolicyRule_trackType').attr('required', true);
        $('#xslPolicyRule_field').attr('required', true);
        $('#xslPolicyRule_occurrence').attr('required', true);
        $('#xslPolicyRule_validator').attr('required', true);
        $('#xslPolicyRule_valueFreeText').attr('required', false);
        $('#xslPolicyRule_editor_0').prop('checked', true);
    }

    $('#xslPolicyRule_validator').on('change', function() {
        displayValueField($('#xslPolicyRule_validator').val());
    })

    function displayValueField(validator) {
        if ('exists' == validator || 'does_not_exist' == validator) {
            $('#xslPolicyRule_value').parent().addClass('hidden');
        }
        else {
            $('#xslPolicyRule_value').parent().removeClass('hidden');
        }
    }

    $('#xslPolicyRule_trackType').on('change', function() {
        loadFieldsList($('#xslPolicyRule_trackType').val());
        displayOccurenceField($('#xslPolicyRule_trackType').val());
    });

    function displayOccurenceField(trackType) {
        if ('General' == trackType) {
            $('#xslPolicyRule_occurrence').prop('disabled', true);
            $('#xslPolicyRule_occurrence').val('*');
        }
        else {
            $('#xslPolicyRule_occurrence').prop('disabled', false);
        }
    }

    // Display success message
    function successMessage(message) {
        $('#policyInfo div').html('<div class="alert alert-success alert-dismissible"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>' + message + '</div>');
    }

    // Display error message
    function errorMessage(message) {
        $('#policyInfo div').html('<div class="alert alert-danger alert-dismissible"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>' + message + '</div>')
    }

    // Handle fail ajax response
    function failResponse(jqXHR, node) {
        if (typeof jqXHR.responseJSON !== 'undefined') {
            if (jqXHR.responseJSON.hasOwnProperty('quota')) {
                $(node).html(jqXHR.responseJSON.quota);
            }
            else if (jqXHR.responseJSON.hasOwnProperty('message')) {
                errorMessage(jqXHR.responseJSON.message);
            }
            else {
                errorMessage('An error has occured, please try again later');
            }
        }
        else {
            errorMessage('An error has occured, please try again later');
        }
    }
});
