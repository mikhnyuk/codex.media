/**
 * User methods module
 */
module.exports = function () {

    /**
     * Manupulations with user photo
     * @return {Object} - Module
     */
    var photo = function () {

        /**
         * Mark elements with this name="" to dynamically update their sources
         * @type {String}
         */
        var updatableElementsName = 'js-img-updatable';

        /**
         * Changes user's photo
         * @param  {Event}  event   click event
         */
        var change = function ( event, transportType ) {

            codex.transport.init({
                url : '/upload/' + transportType,
                success : uploaded,
                error   : error
            });

        };

        /**
         * Uploading error
         * @param  {Object} error
         */
        var error = function (uploadError) {

            console.log(uploadError);

        };

        /**
         * Photo uploading callback
         * @param  {String} response    server answer
         */
        var uploaded = function (response) {

            response = JSON.parse(response);

            if ( !response.success ) {

                codex.alerts.show({
                    type: 'error',
                    message: response.message || 'File uploading error :('
                });

                return;

            }

            console.assert( response.data && response.data.url, 'Wrong response data');

            updateAll( response.data.url );

        };

        /**
         * Updates all user photo sources
         * @uses   updatableElementsName  to find img tags
         * @param  {String} newSource
         */
        var updateAll = function ( newSource) {

            var updatebleImages = document.getElementsByName(updatableElementsName);

            for (var i = updatebleImages.length - 1; i >= 0; i--) {

                updatebleImages[i].src = newSource;

            }

        };

        return {
            change : change
        };

    }();

    /**
     * Updatin user ROLE or STATUS
     * @type {{status, role}}
     */
    var promote = function () {

        var status = function (args) {

            var itemClicked = this,
                userId = itemClicked.dataset.id,
                value = args.value;

            sendRequest(itemClicked, 'status', userId, value);

        };

        var role = function (args) {

            var itemClicked = this,
                userId = itemClicked.dataset.id,
                value = args.value;

            sendRequest(itemClicked, 'role', userId, value);

        };

        /**
         * Change user role or status request
         * @param {Element} itemClicked     - menu item element
         * @param {string}  field           - field to save (role|status)
         * @param {Number}  userId          - target user id
         * @param {Number}  value           - new value
         */
        var sendRequest = function (itemClicked, field, userId, value) {

            var url = '/user/' + userId + '/change/' + field,
                requestData = new FormData();

            requestData.append('value', value);

            codex.ajax.call({
                url : url,
                type : 'POST',
                data: requestData,
                beforeSend : function () {

                    itemClicked.classList.add('loading');

                },
                success: function (response) {

                    var menuIndex = itemClicked.dataset.index,
                        itemIndex = itemClicked.dataset.itemIndex;

                    response = JSON.parse(response);

                    itemClicked.classList.remove('loading');

                    codex.islandSettings.updateItem(menuIndex, itemIndex, response.buttonText, null, {
                        value: response.buttonValue
                    });

                    codex.alerts.show({
                        type: response.success ? 'success' : 'error',
                        message: response.message || 'Не удалось сохранить изменения'
                    });

                }
            });

        };

        return {
            status : status,
            role   : role
        };

    }();


    var changePassword = function () {

        var wrapper = null,
            input   = null,
            message = null,
            button  = null;

        var showForm = function () {

            var label = document.createElement('LABEL');

            wrapper = this;
            input   = document.createElement('INPUT');
            button  = document.createElement('SPAN');
            message = document.createElement('DIV');

            label.classList.add('form__label');
            label.textContent = 'Текущий пароль';

            input.classList.add('form__input');
            input.type = 'password';

            button.classList.add('button');
            button.classList.add('form__hint');
            button.classList.add('master');
            button.textContent = 'Подтвердить';

            button.addEventListener('click', requestChange);

            wrapper.classList.remove('island--centered');
            wrapper.classList.remove('profile-settings__change-password-btn');
            wrapper.innerHTML = '';
            wrapper.onclick   = '';

            wrapper.appendChild(label);
            wrapper.appendChild(input);
            wrapper.appendChild(button);
            wrapper.appendChild(message);

        };

        var requestChange = function () {

            button.classList.add('loading');

            codex.ajax.call({
                url: '/user/passchange',
                type: 'POST',
                data: JSON.stringify({
                    csrf: window.csrf,
                    currentPassword: input.value
                }),
                success: ajaxResponse,
                error: ajaxResponse
            });

        };

        var ajaxResponse = function (response) {

            button.classList.remove('loading');

            try {

                response = JSON.parse(response);

            } catch (e) {

                response = {success: 0, message: 'Произошла ошибка'};

            }

            if (!response.success) {

                input.classList.add('form__input--invalid');

            } else {

                showSuccessMessage(response.message);
                return;

            }

            message.textContent = response.message;

        };

        var showSuccessMessage = function (text) {

            if (wrapper.dataset.success) {

                return;

            }

            var textDiv = document.createElement('DIV');

            button = document.createElement('BUTTON');

            textDiv.textContent = text;
            textDiv.classList.add('profile-settings__change-password-result-text');

            button.classList.add('button', 'master');
            button.addEventListener('click', requestChange);
            button.textContent = 'Отправить еще раз';

            wrapper.innerHTML = '';
            wrapper.classList.add('island--centered');

            wrapper.appendChild(textDiv);
            wrapper.appendChild(button);
            wrapper.dataset.success = 1;

        };

        return {
            showForm: showForm
        };

    }();

    // var init = function () {
    //
    //     // bindEvents();
    //
    // };

    // var bindEvents = function () {
    //
    //     var repeatConfirmEmailBtn = document.getElementById('repeat-email-confirmation');
    //
    //     repeatConfirmEmailBtn.addEventListener('click', sendEmeailConfirmation);
    //
    // };

    // var sendEmeailConfirmation = function (e) {
    //
    //     var success = function (response) {
    //
    //         response = JSON.parse(response);
    //
    //         codex.alerts.show(response.message);
    //         e.target.classList.remove('loading');
    //
    //     };
    //
    //     e.target.classList.add('loading');
    //
    //     codex.ajax.call({
    //         url: '/ajax/confirmation-email',
    //         success: success
    //     });
    //
    // };


    /**
     * Working with bio
     */
    var bio = function () {

        /**
         * Edited textarea cache
         * @type {Element|null}
         */
        var textarea = null;

        /**
         * Edit bio click handler;
         * @param {Element} button  - button clicked
         */
        var edit = function ( button ) {

            var opened = button.querySelector('textarea');

            if (opened) {

                return;

            }

            textarea = document.createElement('TEXTAREA');
            textarea.innerHTML = button.textContent.trim();
            textarea.addEventListener('keydown', keydown);

            button.innerHTML = '';
            button.appendChild(textarea);

            textarea.focus();

            /** Fire autoresize */
            codex.autoresizeTextarea.addListener(textarea);

        };

        /**
         * Bio textarea keydowns
         * Sends via AJAX by ENTER
         */
        var keydown = function ( event ) {

            if ( event.keyCode == codex.core.keys.ENTER ) {

                send(this.value);
                event.preventDefault();

            }

        };

        /**
         * Sends bio field
         * @param  {String} val textarea value
         */
        var send = function (val) {

            if (!val.trim()) {

                codex.alerts.show({
                    type: 'warn',
                    message: 'Write something about yourself'
                });
                return;

            }

            var formData = new FormData();

            formData.append('bio', val);
            formData.append('csrf', window.csrf);

            codex.ajax.call({
                type : 'POST',
                url : '/user/updateBio',
                data : formData,
                beforeSend: beforeSend,
                success : saved
            });

        };

        /**
         * Simple beforeSend method
         */
        var beforeSend = function () {

            textarea.classList.add('loading');

        };

        /**
         * Success saving callback
         */
        var saved = function (response) {

            response = JSON.parse(response);

            if (!response.success || !response.bio) {

                textarea.classList.remove('loading');
                codex.alerts.show({
                    type: 'error',
                    message: 'Saving error, sorry'
                });
                return;

            }

            var newBio = document.createTextNode(response.bio || '');

            /** Update user's CSRF token */
            window.csrf = response.csrf;

            codex.core.replace(textarea, newBio);

        };

        return {
            edit: edit
        };

    }();

    return {
        changePassword: changePassword,
        promote: promote,
        photo: photo,
        bio : bio,
    };

}();