S(document).ready(async function() {
    uids = []
    users = []
    async function render_users() {
        users = []
        uids = []
        await fetch("/get-users")
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            users = data;
        })

        var elements = `
        <table id="user-table">
            <tr>
                <th>ID:</th>
                <th>User:</th>
                <th>Civ:</th>
                <th>Modify:</th>
            </tr>
        `
        for (const user of users) {
            uids.push(user.id)
            elements += `
            <tr>
                <td>` + user.id + `</td>
                <td>
                    <p id="username-` + user.id + `">` + user.username + `</p>
                    <input type="text" id="modify-username-` + user.id + `" style="display:none">
                </td>
                <td>
                    <p id="civ_name-` + user.id + `">` + user.civ_name + `</p>
                    <input type="text" id="modify-civname-` + user.id + `" style="display:none">
                </td>
                <td>
                    <button class="table-button" id=modify-` + user.id + `>Modify User</button>
                    <button class="table-button" id=modify-confirm-` + user.id + ` style="display:none">Confirm</button>
                    <button class="table-button" id=delete-` + user.id + `>Delete</button>
                    <button class="table-button" id=delete-confirm-` + user.id + ` style="display:none">Are you sure?</button>
                </td>
            </tr>
            `
        }
        elements += '</table>'
        S("#users").html(elements);

        for (const id of uids) {
            document.getElementById("modify-" + id).addEventListener('click', function() {
                document.getElementById('modify-' + id).style.display = 'none';
                document.getElementById('modify-confirm-' + id).style.display = 'inline';

                document.getElementById('modify-username-' + id).style.display = 'inline';
                document.getElementById('modify-civname-' + id).style.display = 'inline';

                document.getElementById('modify-username-' + id).placeholder = document.getElementById('username-' + id).textContent;
                document.getElementById('modify-civname-' + id).placeholder = document.getElementById('civ_name-' + id).textContent;

                document.getElementById('username-' + id).style.display = "none";
                document.getElementById('civ_name-' + id).style.display = "none";
            });
            document.getElementById("modify-confirm-" + id).addEventListener('click', async function() {
                if (document.getElementById('modify-username-' + id).value != null || document.getElementById('modify-civname-' + id) != null) {
                    upd_obj = {
                        'id': id,
                        'username': document.getElementById('modify-username-' + id).value,
                        'civ_name': document.getElementById('modify-civname-' + id).value
                    }
                    await fetch('manage-modify', {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(upd_obj)
                    });
                    
                    render_users()

                }
            });


            document.getElementById("delete-" + id).addEventListener('click', function() {
                document.getElementById('delete-confirm-' + id).style.display = 'inline';
                document.getElementById('delete-' + id).style.display = 'none';
            });
            document.getElementById("delete-confirm-" + id).addEventListener('click', async function() {
                await fetch('manage-delete', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({"id": id})
                });
                render_users();
            });
        }
    }

    await render_users()

});