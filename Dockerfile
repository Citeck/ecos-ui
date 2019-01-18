FROM nginx
COPY server.conf /etc/nginx/conf.d/default.conf
COPY build/ /var/www/assets/
