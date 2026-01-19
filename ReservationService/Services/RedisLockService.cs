using StackExchange.Redis;

namespace ReservationService.Services;

public class RedisLockService
{
    private readonly IDatabase _db;

    public RedisLockService(IConnectionMultiplexer mux)
    {
        _db = mux.GetDatabase();
    }

    public async Task<string?> AcquireLockAsync(string key, TimeSpan ttl)
    {
        var token = Guid.NewGuid().ToString("N");

        var acquired = await _db.StringSetAsync(
            key, token, ttl, when: When.NotExists);

        return acquired ? token : null;
    }

    public async Task ReleaseLockAsync(string key, string token)
    {
        const string script = @"
if redis.call('get', KEYS[1]) == ARGV[1] then
  return redis.call('del', KEYS[1])
else
  return 0
end";

        await _db.ScriptEvaluateAsync(
            script,
            new RedisKey[] { key },
            new RedisValue[] { token });
    }
}
