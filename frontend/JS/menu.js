(() => {
    const usuarioSalvo = localStorage.getItem("usuario");
    const menuChamadosTecnico = document.getElementById("menuChamadosTecnico");
    const menuAdministracao = document.getElementById("menuAdministracao");

    if (usuarioSalvo) {
        try {
            const usuario = JSON.parse(usuarioSalvo);

            if (menuChamadosTecnico) {
                menuChamadosTecnico.hidden = usuario.tipo !== "tecnico";
            }

            if (menuAdministracao) {
                menuAdministracao.hidden = usuario.tipo !== "administrador";
            }
        } catch (erro) {
            console.error("Erro ao carregar usuário do menu:", erro);
        }
    }
})();
