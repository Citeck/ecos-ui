#This docker image for developers of other applications
FROM nginx
COPY server.conf /etc/nginx/conf.d/default.conf
COPY build/ /var/www/assets/
COPY docker/ext-dev/start.sh /start.sh
RUN chmod +x /start.sh
CMD /start.sh
