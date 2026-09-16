(() => {
    const usuarioSalvo = localStorage.getItem("usuario");
    const menuAbrirChamado = document.getElementById("menuAbrirChamado");
    const menuMeusChamados = document.getElementById("menuMeusChamados");
    const menuChamadosTecnico = document.getElementById("menuChamadosTecnico");
    const menuAdministracao = document.getElementById("menuAdministracao");

    if (usuarioSalvo) {
        try {
            const usuario = JSON.parse(usuarioSalvo);
            const tipoUsuario = usuario.tipo;
            const ehUsuarioComum = tipoUsuario === "usuario";
            const ehTecnico = tipoUsuario === "tecnico";
            const ehAdministrador = tipoUsuario === "administrador";

            if (menuAbrirChamado) {
                menuAbrirChamado.hidden = !ehUsuarioComum;
            }

            if (menuMeusChamados) {
                menuMeusChamados.hidden = !ehUsuarioComum;
            }

            if (menuChamadosTecnico) {
                menuChamadosTecnico.hidden = !ehTecnico && !ehAdministrador;
            }

            if (menuAdministracao) {
                menuAdministracao.hidden = !ehAdministrador;
            }
        } catch (erro) {
            console.error("Erro ao carregar usuário do menu:", erro);
        }
    }
})();
