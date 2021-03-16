/*Obtendrá la lista de publicaciones guardadas del usuario en sesión*/
select p.id_publicacion, (select us.usuario from usuarios us where id_user = p.id_user) as publicada_por, 
(select us.url_foto_perfil from usuarios us where id_user = p.id_user), p.descripcion, p.fecha_pub, p.url_pub_fv,
(select count(r.id_reaccion) from reacciones r where r.id_publicacion = g.id_publicacion and r.tipo_reaccion = 'ME_GUSTA') as cant_megusta,
(select count(r.id_reaccion) from reacciones r where r.id_publicacion = g.id_publicacion and r.tipo_reaccion = 'ME_ENCANTA') as cant_meencanta,
(select count(r.id_reaccion) from reacciones r where r.id_publicacion = g.id_publicacion and r.tipo_reaccion = 'ME_ENTRISTECE') as cant_meentristece,
(select count(r.id_reaccion) from reacciones r where r.id_publicacion = g.id_publicacion and r.tipo_reaccion = 'ME_ENFADA') as cant_meenfada,
(select count(r.id_reaccion) from reacciones r where r.id_publicacion = g.id_publicacion and r.tipo_reaccion = 'ME_DIVIERTE') as cant_medivierte,
(select count(r.id_reaccion) from reacciones r where r.id_publicacion = g.id_publicacion and r.tipo_reaccion = 'ME_SORPRENDE') as cant_mesorprende,
(select count(c.id_comentario) from comentarios c where c.id_publicacion = g.id_publicacion) as cant_comentarios,
(select re.tipo_reaccion from reacciones re where p.id_publicacion = re.id_publicacion and re.id_user = 45) as reaccion_usada
from publicaciones p, pub_guardadas g
where g.id_user = 45 and p.id_publicacion = g.id_publicacion;

/*Obtener lista de publicaciones realizadas por las personas que el usuario en sesión sigue*/
select p.id_publicacion, (select us.usuario from usuarios us where id_user = p.id_user) as publicada_por, 
(select us.url_foto_perfil from usuarios us where id_user = p.id_user), p.descripcion, p.fecha_pub, p.url_pub_fv,
(select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_GUSTA') as cant_megusta,
(select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_ENCANTA') as cant_meencanta,
(select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_ENTRISTECE') as cant_meentristece,
(select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_ENFADA') as cant_meenfada,
(select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_DIVIERTE') as cant_medivierte,
(select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_SORPRENDE') as cant_mesorprende,
(select count(c.id_comentario) from comentarios c where c.id_publicacion = p.id_publicacion) as cant_comentarios,
(select re.tipo_reaccion from reacciones re where p.id_publicacion = re.id_publicacion and re.id_user=45) as reaccion_usada
from publicaciones p 
where p.id_user in(select s.follow_to from seguidos s where s.id_user = 45 ) or p.id_user = 45;



/*Obtendrá la lista de publicaciones creadas por el usuario en sesión*/
select p.id_publicacion, (select us.usuario from usuarios us where id_user = p.id_user) as publicada_por, 
(select us.url_foto_perfil from usuarios us where id_user = p.id_user), p.descripcion, p.fecha_pub, p.url_pub_fv,
(select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_GUSTA') as cant_megusta,
(select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_ENCANTA') as cant_meencanta,
(select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_ENTRISTECE') as cant_meentristece,
(select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_ENFADA') as cant_meenfada,
(select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_DIVIERTE') as cant_medivierte,
(select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_SORPRENDE') as cant_mesorprende,
(select count(c.id_comentario) from comentarios c where c.id_publicacion = p.id_publicacion) as cant_comentarios,
(select re.tipo_reaccion from reacciones re where p.id_publicacion = re.id_publicacion and re.id_user=45) as reaccion_usada
from publicaciones p 
where p.id_user = 45;



/*Obtener comentarios con sus reacciones*/
SELECT c.*, u.usuario,
(select count(rc.id_reaccion_comentario) from reacciones_comentarios rc where rc.id_comentario = c.id_comentario and rc.tipo_reaccion = 'ME_GUSTA') as cant_megusta,
(select count(rc.id_reaccion_comentario) from reacciones_comentarios rc where rc.id_comentario = c.id_comentario and rc.tipo_reaccion = 'ME_ENCANTA') as cant_meencanta,
(select count(rc.id_reaccion_comentario) from reacciones_comentarios rc where rc.id_comentario = c.id_comentario and rc.tipo_reaccion = 'ME_ENTRISTECE') as cant_meentristece,
(select count(rc.id_reaccion_comentario) from reacciones_comentarios rc where rc.id_comentario = c.id_comentario and rc.tipo_reaccion = 'ME_ENFADA') as cant_meenfada,
(select count(rc.id_reaccion_comentario) from reacciones_comentarios rc where rc.id_comentario = c.id_comentario and rc.tipo_reaccion = 'ME_DIVIERTE') as cant_medivierte,
(select count(rc.id_reaccion_comentario) from reacciones_comentarios rc where rc.id_comentario = c.id_comentario and rc.tipo_reaccion = 'ME_SORPRENDE') as cant_mesorprende,
(select rc.tipo_reaccion from reacciones_comentarios rc where c.id_comentario = rc.id_comentario and rc.id_user = 45) as reaccion_usada
 FROM comentarios c, usuarios u WHERE c.id_user= u.id_user and c.id_publicacion = 37;


/*Obtener Información de un usuario en especifico*/
SELECT us.id_user, (us.nombres || ' ' || us.apellidos) as nombre_completo, us.usuario, us.correo, us.url_foto_perfil, us.url_foto_portada, 
(select ciu.nombre_ciudad || ', ' ||(select prov.nombre_provincia|| ', ' ||
									 (select pa.nombre_pais from pais pa where pa.id_pais = prov.id_pais) 
									 from provincia prov where prov.id_provincia = ciu.id_provincia)  
 from ciudad ciu where ciu.id_ciudad = us.id_ciudad ) as ubicacion,
(select count(*) from seguidos s where s.id_user = us.id_user) as cant_seguidos,
(select count(*) from seguidores se where se.id_user = us.id_user) as cant_seguidores,
(select count(*) from publicaciones pu where pu.id_user = us.id_user) as cant_publicaciones
FROM usuarios us where us.id_user = 45;


/*Obtener lista de usuarios seguidos*/
/*select  s.follow_to, u.usuario, (u.nombres||' '||u.apellidos) as nombre_usuario, u.url_foto_perfil
from seguidos s, usuarios u where u.id_user = s.follow_to and s.id_user = 26;*/

select  s.follow_me, u.usuario, (u.nombres||' '||u.apellidos) as nombre_usuario, u.url_foto_perfil
,(select sg.id_user from seguidos sg where sg.id_user = 27 and sg.follow_to =s.follow_me) as seguido
from seguidores s, usuarios u where u.id_user = s.follow_me and s.id_user = 27;


/*

select  s.follow_me, u.usuario, (u.nombres||' '||u.apellidos) as nombre_usuario, u.url_foto_perfil
,(select sg.id_user from seguidos sg where sg.id_user = 27 and sg.follow_to =s.follow_me) as se
from seguidores s, usuarios u where u.id_user = s.follow_me and s.id_user = 27;
*/

/*Obtener lista de usuarios seguidores*/
select  s.follow_me, u.usuario, (u.nombres||' '||u.apellidos) as nombre_usuario, u.url_foto_perfil
from seguidores s, usuarios u where u.id_user = s.follow_me and s.id_user = 27;


/*Cantidad de views en historias*/
select h.*, us.usuario as publicada_por, us.url_foto_perfil, 
(select count(vh.id_view) from views_historias vh where vh.id_historia = h.id_historia ) as cant_views
from historias h, usuarios us
where  us.id_user = h.id_user and h.id_user in(select s.follow_to from seguidos s where s.id_user = 26);