$(document).ready(function () {
    $(document).on('click', '[data-role="add-gh"]', function (e) {
        e.preventDefault();
        var container = $('.form-inline > .gh-headers')[0];
        new_field_group = $(container).clone();
        new_field_group.find('input').each(function () {
            $(this).val('');
        });
        $(container).after(new_field_group);
    });

    $(document).on('click', '[data-role="dynamic-fields"] > .form-inline [data-role="remove-gh"]', function (e) {
        e.preventDefault();
        $(this).closest('.gh-headers').remove();
    });

    $(document).on('click', '[data-role="add-sw"]', function (e) {
        e.preventDefault();
        var container = $('.form-inline > .sw-headers')[0];
        new_field_group = $(container).clone();
        new_field_group.find('input').each(function () {
            $(this).val('');
        });
        $(container).after(new_field_group);
    });

    $(document).on('click', '[data-role="remove-sw"]', function (e) {
        e.preventDefault();
        $(this).closest('.sw-headers').remove();
    });

    $(document).on('click', '.exclude-status-code', function (e) {
        e.preventDefault();
        var pathName = window.location.pathname.replace('/view/projects', '');
        const data = $(this).data();
        // Send the data using post
        const parent = $(this).closest('.list-group-item');
        $.ajax({
            type: 'PUT',
            url: `${pathName}/config`,
            dataType: 'json',
            contentType: 'application/json;charset=UTF-8',
            data: JSON.stringify(data),
            success: function (data) {
                parent.remove()
            },
            error: function (xhr, status, error) {
                $('#validationFeedback').text(xhr.responseJSON.error);
                $('#validationFeedback').show();
            },
        });
    });

    $(document).on('click', '.include-status-code', function (e) {
        e.preventDefault();
        var pathName = window.location.pathname.replace('/view/projects', '');
        const data = $(this).data();
        // Send the data using post
        const parent = $(this).closest('.list-group-item');
        $.ajax({
            type: 'PUT',
            url: `${pathName}/config`,
            dataType: 'json',
            contentType: 'application/json;charset=UTF-8',
            data: JSON.stringify(data),
            success: function (data) {
                parent.remove();
            },
            error: function (xhr, status, error) {
                $('#validationFeedback').text(xhr.responseJSON.error);
                $('#validationFeedback').show();
            },
        });
    });

    $('#swaggerForm').submit(function (event) {
        // Stop form from submitting normally
        event.preventDefault();
        var pathName = window.location.pathname;
        
        // Get some values from elements on the page:
        var buildName = $('#buildName').val();
        var serviceUrl = $('#apiServiceUrl').val();
        var swaggerUrl = $('#specificationUrl').val();
        var basePath = $('#basePath').val();

        var headers = {};
        $('.sw-headers').each(function () {
            var name = $(this).children('.name').val();
            var value = $(this).children('.value').val();
            headers[[name]] = value;
        });

        const swaggerSpecification = $('#swaggerSpecification')[0].files[0];

        var formData = new FormData()
        formData.append("name", buildName);
        formData.append("specification", swaggerSpecification);
        formData.append("serviceUrl", serviceUrl);
        formData.append("type", "swagger");
        formData.append("swaggerUrl", swaggerUrl);
        formData.append("basePath", basePath);
        formData.append("headers", headers);

        // Send the data using post
        $.ajax({
            type: 'POST',
            url: pathName.replace('/create-build', '/builds').replace('/projects', ""),
            contentType: 'multipart/form-data',
            data: formData,
            processData: false,
            contentType: false,
            cache: false,
            success: function (data) {
                window.location.href = `/view${pathName.replace('/create-build', '')}`;
            },
            error: function (xhr, status, error) {
                $('#validationFeedback').text(xhr.responseJSON.error);
                $('#validationFeedback').show();
            },
        });
    });

    $('#grapqhQlForm').submit(function (event) {
        // Stop form from submitting normally
        event.preventDefault();
        var pathName = window.location.pathname;
        // Get some values from elements on the page:
        var buildName = $('#ghBuildName').val();
        var graphqlUrl = $('#graphqlUrl').val();

        var headers = {};
        $('.gh-headers').each(function () {
            var name = $(this).children('.name').val();
            var value = $(this).children('.value').val();
            if (name && value) {
                headers[[name]] = value;
            }
        });

        var formData = new FormData()
        formData.append("name", buildName);
        formData.append("graphqlUrl", graphqlUrl)
        formData.append("type", "graphql");
        formData.append("headers", headers);

        

        // Send the data using post
        $.ajax({
            type: 'POST',
            url: pathName.replace('/create-build', '/builds').replace('/projects', ""),
            contentType: 'multipart/form-data',
            data: formData,
            processData: false,
            contentType: false,
            cache: false,
            success: function (data) {
                window.location.href = `/view${pathName.replace('/create-build', '')}`;
            },
            error: function (xhr, status, error) {
                $('#validationFeedbackGQ').text(xhr.responseJSON.error);
                $('#validationFeedbackGQ').show();
            },
        });
    });
});
