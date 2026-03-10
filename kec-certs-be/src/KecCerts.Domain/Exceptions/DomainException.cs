namespace KecCerts.Domain.Exceptions;

public class DomainException : Exception
{
    public DomainException(string message) : base(message) { }
    public DomainException(string message, Exception innerException) : base(message, innerException) { }
}

public class NotFoundException : DomainException
{
    public NotFoundException(string entityName, object key)
        : base($"Entity '{entityName}' with key '{key}' was not found.") { }
}

public class DuplicateException : DomainException
{
    public DuplicateException(string entityName, string field, object value)
        : base($"Entity '{entityName}' with {field} '{value}' already exists.") { }
}
