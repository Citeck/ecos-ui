FROM nginx
COPY server.conf /etc/nginx/conf.d/
COPY build/ /var/www/assets/
