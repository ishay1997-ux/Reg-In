alter table users drop constraint users_status_check;
update users set status = 'inactive' where status = 'frozen';
alter table users add constraint users_status_check check (status in ('active', 'inactive'));
