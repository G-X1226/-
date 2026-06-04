local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[2])
end
if current > tonumber(ARGV[1]) then
  return {0, 0, redis.call('PTTL', KEYS[1])}
end
return {1, tonumber(ARGV[1]) - current, redis.call('PTTL', KEYS[1])}
