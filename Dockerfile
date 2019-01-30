FROM nginx
COPY server.conf /etc/nginx/conf.d/default.conf
COPY build/ /var/www/assets/
COPY start.sh /start.sh
RUN chmod +x /start.sh
CMD /start.sh
